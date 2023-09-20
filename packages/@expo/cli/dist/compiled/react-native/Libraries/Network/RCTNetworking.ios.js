'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _RCTDeviceEventEmitter = _interopRequireDefault(require("../EventEmitter/RCTDeviceEventEmitter"));
var _convertRequestBody = _interopRequireDefault(require("./convertRequestBody"));
var _NativeNetworkingIOS = _interopRequireDefault(require("./NativeNetworkingIOS"));
var RCTNetworking = {
  addListener: function addListener(eventType, listener, context) {
    return _RCTDeviceEventEmitter.default.addListener(eventType, listener, context);
  },
  sendRequest: function sendRequest(method, trackingName, url, headers, data, responseType, incrementalUpdates, timeout, callback, withCredentials) {
    var body = (0, _convertRequestBody.default)(data);
    _NativeNetworkingIOS.default.sendRequest({
      method: method,
      url: url,
      data: Object.assign({}, body, {
        trackingName: trackingName
      }),
      headers: headers,
      responseType: responseType,
      incrementalUpdates: incrementalUpdates,
      timeout: timeout,
      withCredentials: withCredentials
    }, callback);
  },
  abortRequest: function abortRequest(requestId) {
    _NativeNetworkingIOS.default.abortRequest(requestId);
  },
  clearCookies: function clearCookies(callback) {
    _NativeNetworkingIOS.default.clearCookies(callback);
  }
};
var _default = RCTNetworking;
exports.default = _default;
//# sourceMappingURL=RCTNetworking.ios.js.map