'use strict';

var ReactNative;
if (__DEV__) {
  ReactNative = require("../implementations/ReactNativeRenderer-dev");
} else {
  ReactNative = require("../implementations/ReactNativeRenderer-prod");
}
module.exports = ReactNative;
//# sourceMappingURL=ReactNative.js.map