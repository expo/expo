'use strict';

var _require = require("../Utilities/FeatureDetection"),
  hasNativeConstructor = _require.hasNativeConstructor;
var _require2 = require("../Utilities/PolyfillFunctions"),
  polyfillGlobal = _require2.polyfillGlobal;
var hasNativeGenerator;
try {
  hasNativeGenerator = hasNativeConstructor(function* () {}, 'GeneratorFunction');
} catch (_unused) {
  hasNativeGenerator = false;
}
if (!hasNativeGenerator) {
  polyfillGlobal('regeneratorRuntime', function () {
    delete global.regeneratorRuntime;
    return require('regenerator-runtime/runtime');
  });
}
//# sourceMappingURL=setUpRegeneratorRuntime.js.map