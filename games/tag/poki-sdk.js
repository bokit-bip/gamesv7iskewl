(() => {
  'use strict';
  const noop = () => {};
  const resolvePromise = () => Promise.resolve();
  const resolveTrue = () => Promise.resolve(true);

  const PokiSDK = {
    init: resolvePromise,
    initWithVideoHB: resolvePromise,
    customEvent: noop,
    commercialBreak: resolvePromise,
    rewardedBreak: resolveTrue,
    displayAd: noop,
    destroyAd: noop,
    getLeaderboard: () => Promise.resolve([]),
    getSharableURL: () => Promise.resolve(window.location.href),
    getURLParam: (n) => {
      try {
        const match = RegExp('[?&]' + n + '=([^&]*)').exec(window.location.search);
        return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
      } catch (e) {
        return '';
      }
    },
    disableProgrammatic: noop,
    gameLoadingStart: noop,
    gameLoadingFinished: noop,
    gameInteractive: noop,
    roundStart: noop,
    roundEnd: noop,
    muteAd: noop,
    setDebug: noop,
    gameplayStart: noop,
    gameplayStop: noop,
    gameLoadingProgress: noop,
    happyTime: noop,
    setPlayerAge: noop,
    togglePlayerAdvertisingConsent: noop,
    logError: noop,
    sendHighscore: noop,
    setDebugTouchOverlayController: noop,
    isAdBlocked: () => false
  };

  window.PokiSDK = PokiSDK;
})();