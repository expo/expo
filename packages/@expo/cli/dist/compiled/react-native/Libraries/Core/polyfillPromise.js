'use strict';

var _global, _global$HermesInterna;
var _require = require('../Utilities/PolyfillFunctions'),
  polyfillGlobal = _require.polyfillGlobal;
if ((_global = global) != null && (_global$HermesInterna = _global.HermesInternal) != null && _global$HermesInterna.hasPromise != null && _global$HermesInterna.hasPromise()) {
  var HermesPromise = global.Promise;
  if (__DEV__) {
    var _global$HermesInterna2;
    if (typeof HermesPromise !== 'function') {
      console.error('HermesPromise does not exist');
    }
    (_global$HermesInterna2 = global.HermesInternal) == null ? void 0 : _global$HermesInterna2.enablePromiseRejectionTracker == null ? void 0 : _global$HermesInterna2.enablePromiseRejectionTracker(require('../promiseRejectionTrackingOptions').default);
  }
} else {
  polyfillGlobal('Promise', function () {
    return require('../Promise');
  });
}