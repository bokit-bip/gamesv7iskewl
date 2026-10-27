'use strict';
(function() {
  var tmpCanvas = document.createElement("canvas");
  var hasWebGL = false;
  try {
    hasWebGL = !!(
      tmpCanvas.getContext("webgl2") ||
      tmpCanvas.getContext("webgl") ||
      tmpCanvas.getContext("experimental-webgl")
    );
  } catch (e) {
    hasWebGL = false;
  }

  // Construct 3 can attempt runtime WebGL/2D fallback regardless
  window["C3_IsSupported"] = true;

  // Ensure no error overlay is present or lingering
  const existingWrap = document.getElementById("notSupportedWrap");
  if (existingWrap) {
    existingWrap.remove();
  }
})();
