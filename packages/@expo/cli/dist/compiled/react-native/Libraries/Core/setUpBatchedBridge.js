'use strict';

var registerModule;
if (global.RN$Bridgeless === true && global.RN$registerCallableModule) {
  registerModule = global.RN$registerCallableModule;
} else {
  var BatchedBridge = require("../BatchedBridge/BatchedBridge");
  registerModule = function registerModule(moduleName, factory) {
    return BatchedBridge.registerLazyCallableModule(moduleName, factory);
  };
}
registerModule('Systrace', function () {
  return require("../Performance/Systrace");
});
if (!(global.RN$Bridgeless === true)) {
  registerModule('JSTimers', function () {
    return require("./Timers/JSTimers");
  });
}
registerModule('HeapCapture', function () {
  return require("../HeapCapture/HeapCapture");
});
registerModule('SamplingProfiler', function () {
  return require("../Performance/SamplingProfiler");
});
registerModule('RCTLog', function () {
  return require("../Utilities/RCTLog");
});
registerModule('RCTDeviceEventEmitter', function () {
  return require("../EventEmitter/RCTDeviceEventEmitter").default;
});
registerModule('RCTNativeAppEventEmitter', function () {
  return require("../EventEmitter/RCTNativeAppEventEmitter");
});
registerModule('GlobalPerformanceLogger', function () {
  return require("../Utilities/GlobalPerformanceLogger");
});
if (__DEV__) {
  registerModule('HMRClient', function () {
    return require("../Utilities/HMRClient");
  });
} else {
  registerModule('HMRClient', function () {
    return require("../Utilities/HMRClientProdShim");
  });
}
//# sourceMappingURL=setUpBatchedBridge.js.map