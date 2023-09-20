'use strict';

var _global$HermesInterna, _global$HermesInterna2;
var _require = require('../Utilities/FeatureDetection'),
  isNativeFunction = _require.isNativeFunction;
var _require2 = require('../Utilities/PolyfillFunctions'),
  polyfillGlobal = _require2.polyfillGlobal;
if (__DEV__) {
  if (typeof global.Promise !== 'function') {
    console.error('Promise should exist before setting up timers.');
  }
}
var hasHermesPromiseQueuedToJSVM = ((_global$HermesInterna = global.HermesInternal) == null ? void 0 : _global$HermesInterna.hasPromise == null ? void 0 : _global$HermesInterna.hasPromise()) === true && ((_global$HermesInterna2 = global.HermesInternal) == null ? void 0 : _global$HermesInterna2.useEngineQueue == null ? void 0 : _global$HermesInterna2.useEngineQueue()) === true;
var hasNativePromise = isNativeFunction(Promise);
var hasPromiseQueuedToJSVM = hasNativePromise || hasHermesPromiseQueuedToJSVM;
if (global.RN$Bridgeless !== true) {
  var defineLazyTimer = function defineLazyTimer(name) {
    polyfillGlobal(name, function () {
      return require('./Timers/JSTimers')[name];
    });
  };
  defineLazyTimer('setTimeout');
  defineLazyTimer('clearTimeout');
  defineLazyTimer('setInterval');
  defineLazyTimer('clearInterval');
  defineLazyTimer('requestAnimationFrame');
  defineLazyTimer('cancelAnimationFrame');
  defineLazyTimer('requestIdleCallback');
  defineLazyTimer('cancelIdleCallback');
}
if (hasPromiseQueuedToJSVM) {
  polyfillGlobal('setImmediate', function () {
    return require('./Timers/immediateShim').setImmediate;
  });
  polyfillGlobal('clearImmediate', function () {
    return require('./Timers/immediateShim').clearImmediate;
  });
} else {
  if (global.RN$Bridgeless !== true) {
    polyfillGlobal('setImmediate', function () {
      return require('./Timers/JSTimers').queueReactNativeMicrotask;
    });
    polyfillGlobal('clearImmediate', function () {
      return require('./Timers/JSTimers').clearReactNativeMicrotask;
    });
  }
}
if (hasHermesPromiseQueuedToJSVM) {
  polyfillGlobal('queueMicrotask', function () {
    var _global$HermesInterna3;
    return (_global$HermesInterna3 = global.HermesInternal) == null ? void 0 : _global$HermesInterna3.enqueueJob;
  });
} else {
  polyfillGlobal('queueMicrotask', function () {
    return require('./Timers/queueMicrotask.js').default;
  });
}
//# sourceMappingURL=setUpTimers.js.map