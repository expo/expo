'use strict';

var _ReactNativePrivateInterface = require("react-native/Libraries/ReactPrivate/ReactNativePrivateInterface");
var register = _ReactNativePrivateInterface.ReactNativeViewConfigRegistry.register;
var createReactNativeComponentClass = function createReactNativeComponentClass(name, callback) {
  return register(name, callback);
};
module.exports = createReactNativeComponentClass;
//# sourceMappingURL=createReactNativeComponentClass.js.map