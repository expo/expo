'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var XMLHttpRequest = require('../Network/XMLHttpRequest');
var InspectorAgent = require('./InspectorAgent');
var JSInspector = require('./JSInspector');
var Interceptor = function () {
  function Interceptor(agent) {
    (0, _classCallCheck2.default)(this, Interceptor);
    this._agent = agent;
    this._requests = new Map();
  }
  (0, _createClass2.default)(Interceptor, [{
    key: "getData",
    value: function getData(requestId) {
      return this._requests.get(requestId);
    }
  }, {
    key: "requestSent",
    value: function requestSent(id, url, method, headers) {
      var requestId = String(id);
      this._requests.set(requestId, '');
      var request = {
        url: url,
        method: method,
        headers: headers,
        initialPriority: 'Medium'
      };
      var event = {
        requestId: requestId,
        documentURL: '',
        frameId: '1',
        loaderId: '1',
        request: request,
        timestamp: JSInspector.getTimestamp(),
        initiator: {
          type: 'other'
        },
        type: 'Other'
      };
      this._agent.sendEvent('requestWillBeSent', event);
    }
  }, {
    key: "responseReceived",
    value: function responseReceived(id, url, status, headers) {
      var requestId = String(id);
      var response = {
        url: url,
        status: status,
        statusText: String(status),
        headers: headers,
        requestHeaders: {},
        mimeType: this._getMimeType(headers),
        connectionReused: false,
        connectionId: -1,
        encodedDataLength: 0,
        securityState: 'unknown'
      };
      var event = {
        requestId: requestId,
        frameId: '1',
        loaderId: '1',
        timestamp: JSInspector.getTimestamp(),
        type: 'Other',
        response: response
      };
      this._agent.sendEvent('responseReceived', event);
    }
  }, {
    key: "dataReceived",
    value: function dataReceived(id, data) {
      var requestId = String(id);
      var existingData = this._requests.get(requestId) || '';
      this._requests.set(requestId, existingData.concat(data));
      var event = {
        requestId: requestId,
        timestamp: JSInspector.getTimestamp(),
        dataLength: data.length,
        encodedDataLength: data.length
      };
      this._agent.sendEvent('dataReceived', event);
    }
  }, {
    key: "loadingFinished",
    value: function loadingFinished(id, encodedDataLength) {
      var event = {
        requestId: String(id),
        timestamp: JSInspector.getTimestamp(),
        encodedDataLength: encodedDataLength
      };
      this._agent.sendEvent('loadingFinished', event);
    }
  }, {
    key: "loadingFailed",
    value: function loadingFailed(id, error) {
      var event = {
        requestId: String(id),
        timestamp: JSInspector.getTimestamp(),
        type: 'Other',
        errorText: error
      };
      this._agent.sendEvent('loadingFailed', event);
    }
  }, {
    key: "_getMimeType",
    value: function _getMimeType(headers) {
      var contentType = headers['Content-Type'] || '';
      return contentType.split(';')[0];
    }
  }]);
  return Interceptor;
}();
var NetworkAgent = function (_InspectorAgent) {
  (0, _inherits2.default)(NetworkAgent, _InspectorAgent);
  var _super = _createSuper(NetworkAgent);
  function NetworkAgent() {
    (0, _classCallCheck2.default)(this, NetworkAgent);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(NetworkAgent, [{
    key: "enable",
    value: function enable(_ref) {
      var maxResourceBufferSize = _ref.maxResourceBufferSize,
        maxTotalBufferSize = _ref.maxTotalBufferSize;
      this._interceptor = new Interceptor(this);
      XMLHttpRequest.setInterceptor(this._interceptor);
    }
  }, {
    key: "disable",
    value: function disable() {
      XMLHttpRequest.setInterceptor(null);
      this._interceptor = null;
    }
  }, {
    key: "getResponseBody",
    value: function getResponseBody(_ref2) {
      var requestId = _ref2.requestId;
      return {
        body: this.interceptor().getData(requestId),
        base64Encoded: false
      };
    }
  }, {
    key: "interceptor",
    value: function interceptor() {
      if (this._interceptor) {
        return this._interceptor;
      } else {
        throw Error('_interceptor can not be null');
      }
    }
  }]);
  return NetworkAgent;
}(InspectorAgent);
NetworkAgent.DOMAIN = 'Network';
module.exports = NetworkAgent;
//# sourceMappingURL=NetworkAgent.js.map