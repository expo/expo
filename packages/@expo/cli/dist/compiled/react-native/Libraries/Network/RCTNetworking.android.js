var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _NativeEventEmitter2 = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _convertRequestBody = _interopRequireDefault(require("./convertRequestBody"));
var _NativeNetworkingAndroid = _interopRequireDefault(require("./NativeNetworkingAndroid"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function convertHeadersMapToArray(headers) {
  var headerArray = [];
  for (var name in headers) {
    headerArray.push([name, headers[name]]);
  }
  return headerArray;
}
var _requestId = 1;
function generateRequestId() {
  return _requestId++;
}
var RCTNetworking = function (_NativeEventEmitter) {
  (0, _inherits2.default)(RCTNetworking, _NativeEventEmitter);
  var _super = _createSuper(RCTNetworking);
  function RCTNetworking() {
    (0, _classCallCheck2.default)(this, RCTNetworking);
    return _super.call(this, _Platform.default.OS !== 'ios' ? null : _NativeNetworkingAndroid.default);
  }
  (0, _createClass2.default)(RCTNetworking, [{
    key: "sendRequest",
    value: function sendRequest(method, trackingName, url, headers, data, responseType, incrementalUpdates, timeout, callback, withCredentials) {
      var body = (0, _convertRequestBody.default)(data);
      if (body && body.formData) {
        body.formData = body.formData.map(function (part) {
          return Object.assign({}, part, {
            headers: convertHeadersMapToArray(part.headers)
          });
        });
      }
      var requestId = generateRequestId();
      _NativeNetworkingAndroid.default.sendRequest(method, url, requestId, convertHeadersMapToArray(headers), Object.assign({}, body, {
        trackingName: trackingName
      }), responseType, incrementalUpdates, timeout, withCredentials);
      callback(requestId);
    }
  }, {
    key: "abortRequest",
    value: function abortRequest(requestId) {
      _NativeNetworkingAndroid.default.abortRequest(requestId);
    }
  }, {
    key: "clearCookies",
    value: function clearCookies(callback) {
      _NativeNetworkingAndroid.default.clearCookies(callback);
    }
  }]);
  return RCTNetworking;
}(_NativeEventEmitter2.default);
var _default = new RCTNetworking();
exports.default = _default;