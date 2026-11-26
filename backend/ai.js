'use strict';
/**
 * GAMES V7 — AI ASSISTANT MODULE
 * Mirrors BokitCord's NVIDIA NIM & Nemotron AI script architecture
 * (streaming SSE, deep reasoning/thinking, multimodal vision auto-switch,
 * /api/ai/health, /api/ai/models, /api/ai/chat), running completely independently
 * inside Games V7 with server-side env-var key management.
 */

const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_TEXT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const DEFAULT_VISION_MODEL = 'nvidia/nemotron-3.5-super-vl-120b-a12b';

function getAiConfig() {
  const baseUrl = (
    process.env.NVIDIA_BASE_URL ||
    (process.env.AI_API_URL ? process.env.AI_API_URL.replace(/\/chat\/completions\/?$/, '') : '') ||
    DEFAULT_BASE_URL
  ).trim().replace(/\/+$/, '');
  const apiKey = (process.env.AI_API_KEY || process.env.NVIDIA_API_KEY || '').trim();
  const textModel = (process.env.AI_MODEL || DEFAULT_TEXT_MODEL).trim();
  const visionModel = (process.env.AI_VISION_MODEL || DEFAULT_VISION_MODEL).trim();
  return { baseUrl, apiKey, textModel, visionModel };
}

function messagesContainImage(messages) {
  if (!Array.isArray(messages)) return false;
  return messages.some((msg) => {
    if (Array.isArray(msg.content)) {
      return msg.content.some((part) => part && (part.type === 'image_url' || part.image_url));
    }
    return false;
  });
}

function getHealthPayload() {
  const cfg = getAiConfig();
  const configured = Boolean(cfg.apiKey);
  return {
    ok: true,
    status: configured ? 'ok' : 'unconfigured',
    configured,
    hasKey: configured,
    name: 'Bokit AI',
    provider: cfg.baseUrl.includes('nvidia.com') ? 'nvidia-nim' : 'openai-compatible',
    textModel: cfg.textModel,
    visionModel: cfg.visionModel,
  };
}

function getModelsPayload() {
  const cfg = getAiConfig();
  return {
    defaultModel: cfg.textModel,
    visionModel: cfg.visionModel,
    models: [
      {
        id: cfg.textModel,
        name: 'Bokit AI (Nemotron 3 Ultra 550B)',
        provider: 'NVIDIA NIM',
        description: 'Flagship 550B model with deep reasoning and thinking capabilities.',
        supportsThinking: true,
        multimodal: false,
      },
      {
        id: cfg.visionModel,
        name: 'Bokit AI Vision (Nemotron 3.5 Super VL 120B)',
        provider: 'NVIDIA NIM',
        description: 'High-throughput multimodal vision reasoning model for image & visual analysis.',
        supportsThinking: true,
        multimodal: true,
      },
    ],
  };
}

async function handleAiChat(req, res, parsedBody, sendJson) {
  const cfg = getAiConfig();
  let {
    messages,
    model = cfg.textModel,
    temperature = 1,
    top_p = 0.95,
    max_tokens = 16384,
    enable_thinking = true,
    stream = true,
    apiKey = null,
  } = parsedBody || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return sendJson(req, res, 400, { error: 'Messages array is required and must not be empty.' });
  }

  // Auto-detect image attachments and dynamically switch to multimodal vision model
  const hasImage = messagesContainImage(messages);
  if (hasImage && (!model || model === cfg.textModel || String(model).includes('nemotron-3-ultra'))) {
    model = cfg.visionModel;
  }

  const keyToUse = (apiKey && String(apiKey).trim()) || cfg.apiKey;
  if (!keyToUse) {
    return sendJson(req, res, 503, {
      error: 'AI API key not configured. Set AI_API_KEY or NVIDIA_API_KEY in Games V7 .env (or configure a custom AI endpoint in Settings).',
      code: 'AI_UNCONFIGURED',
    });
  }

  const sanitizedMessages = messages.slice(-50).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const payload = {
    model,
    messages: sanitizedMessages,
    temperature: Number(temperature) || 1,
    top_p: Number(top_p) || 0.95,
    max_tokens: Math.min(16384, Math.max(64, Number(max_tokens) || 16384)),
    stream: Boolean(stream),
  };

  if (cfg.baseUrl.includes('nvidia.com')) {
    payload.chat_template_kwargs = {
      enable_thinking: Boolean(enable_thinking),
    };
  }

  const upstreamUrl = `${cfg.baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  req.on('close', () => controller.abort());

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keyToUse}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text();
      let parsed = null;
      try { parsed = JSON.parse(errText); } catch (e) {}
      const msg = (parsed && parsed.error && parsed.error.message) || (parsed && parsed.detail) || errText || `HTTP ${upstreamResponse.status}`;
      return sendJson(req, res, upstreamResponse.status, {
        error: `AI API Error (${upstreamResponse.status}): ${msg}`,
      });
    }

    if (!payload.stream) {
      const data = await upstreamResponse.json();
      return sendJson(req, res, 200, data);
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
    });

    const reader = upstreamResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');
    req.on('close', () => {
      try { reader.cancel(); } catch (e) {}
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[GamesV7 AI] Request failed:', err.message);
    if (!res.headersSent) {
      sendJson(req, res, 502, {
        error: err.name === 'AbortError' ? 'AI request timed out.' : `Internal Server Error: ${err.message}`,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}

module.exports = {
  getAiConfig,
  getHealthPayload,
  getModelsPayload,
  handleAiChat,
};
