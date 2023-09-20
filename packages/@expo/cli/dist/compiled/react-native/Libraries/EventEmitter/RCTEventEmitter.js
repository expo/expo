'use strict';

var BatchedBridge = require("../BatchedBridge/BatchedBridge");
var RCTEventEmitter = {
  register: function register(eventEmitter) {
    if (global.RN$Bridgeless) {
      global.RN$registerCallableModule('RCTEventEmitter', function () {
        return eventEmitter;
      });
    } else {
      BatchedBridge.registerCallableModule('RCTEventEmitter', eventEmitter);
    }
  }
};
module.exports = RCTEventEmitter;
//# sourceMappingURL=RCTEventEmitter.js.map