'use strict';

var _ReactNativePrivateInterface = require("react-native/Libraries/ReactPrivate/ReactNativePrivateInterface");
var ReactFabric;
if (__DEV__) {
  ReactFabric = require("../implementations/ReactFabric-dev");
} else {
  ReactFabric = require("../implementations/ReactFabric-prod");
}
if (global.RN$Bridgeless) {
  global.RN$stopSurface = ReactFabric.stopSurface;
} else {
  _ReactNativePrivateInterface.BatchedBridge.registerCallableModule('ReactFabric', ReactFabric);
}
module.exports = ReactFabric;
//# sourceMappingURL=ReactFabric.js.map