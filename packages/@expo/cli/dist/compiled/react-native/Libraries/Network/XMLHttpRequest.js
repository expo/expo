'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var BlobManager = require('../Blob/BlobManager');
var GlobalPerformanceLogger = require('../Utilities/GlobalPerformanceLogger');
var RCTNetworking = require('./RCTNetworking').default;
var base64 = require('base64-js');
var EventTarget = require('event-target-shim');
var invariant = require('invariant');
var DEBUG_NETWORK_SEND_DELAY = false;
if (BlobManager.isAvailable) {
  BlobManager.addNetworkingHandler();
}
var UNSENT = 0;
var OPENED = 1;
var HEADERS_RECEIVED = 2;
var LOADING = 3;
var DONE = 4;
var SUPPORTED_RESPONSE_TYPES = {
  arraybuffer: typeof global.ArrayBuffer === 'function',
  blob: typeof global.Blob === 'function',
  document: false,
  json: true,
  text: true,
  '': true
};
var REQUEST_EVENTS = ['abort', 'error', 'load', 'loadstart', 'progress', 'timeout', 'loadend'];
var XHR_EVENTS = REQUEST_EVENTS.concat('readystatechange');
var XMLHttpRequestEventTarget = function (_ref) {
  (0, _inherits2.default)(XMLHttpRequestEventTarget, _ref);
  var _super = _createSuper(XMLHttpRequestEventTarget);
  function XMLHttpRequestEventTarget() {
    (0, _classCallCheck2.default)(this, XMLHttpRequestEventTarget);
    return _super.apply(this, arguments);
  }
  return (0, _createClass2.default)(XMLHttpRequestEventTarget);
}(EventTarget.apply(void 0, REQUEST_EVENTS));
var XMLHttpRequest = function (_ref2) {
  (0, _inherits2.default)(XMLHttpRequest, _ref2);
  var _super2 = _createSuper(XMLHttpRequest);
  function XMLHttpRequest() {
    var _this;
    (0, _classCallCheck2.default)(this, XMLHttpRequest);
    _this = _super2.call(this);
    _this.UNSENT = UNSENT;
    _this.OPENED = OPENED;
    _this.HEADERS_RECEIVED = HEADERS_RECEIVED;
    _this.LOADING = LOADING;
    _this.DONE = DONE;
    _this.readyState = UNSENT;
    _this.status = 0;
    _this.timeout = 0;
    _this.withCredentials = true;
    _this.upload = new XMLHttpRequestEventTarget();
    _this._aborted = false;
    _this._hasError = false;
    _this._method = null;
    _this._perfKey = null;
    _this._response = '';
    _this._url = null;
    _this._timedOut = false;
    _this._trackingName = 'unknown';
    _this._incrementalEvents = false;
    _this._performanceLogger = GlobalPerformanceLogger;
    _this._reset();
    return _this;
  }
  (0, _createClass2.default)(XMLHttpRequest, [{
    key: "_reset",
    value: function _reset() {
      this.readyState = this.UNSENT;
      this.responseHeaders = undefined;
      this.status = 0;
      delete this.responseURL;
      this._requestId = null;
      this._cachedResponse = undefined;
      this._hasError = false;
      this._headers = {};
      this._response = '';
      this._responseType = '';
      this._sent = false;
      this._lowerCaseResponseHeaders = {};
      this._clearSubscriptions();
      this._timedOut = false;
    }
  }, {
    key: "responseType",
    get: function get() {
      return this._responseType;
    },
    set: function set(responseType) {
      if (this._sent) {
        throw new Error("Failed to set the 'responseType' property on 'XMLHttpRequest': The " + 'response type cannot be set after the request has been sent.');
      }
      if (!SUPPORTED_RESPONSE_TYPES.hasOwnProperty(responseType)) {
        console.warn(`The provided value '${responseType}' is not a valid 'responseType'.`);
        return;
      }
      invariant(SUPPORTED_RESPONSE_TYPES[responseType] || responseType === 'document', `The provided value '${responseType}' is unsupported in this environment.`);
      if (responseType === 'blob') {
        invariant(BlobManager.isAvailable, 'Native module BlobModule is required for blob support');
      }
      this._responseType = responseType;
    }
  }, {
    key: "responseText",
    get: function get() {
      if (this._responseType !== '' && this._responseType !== 'text') {
        throw new Error("The 'responseText' property is only available if 'responseType' " + `is set to '' or 'text', but it is '${this._responseType}'.`);
      }
      if (this.readyState < LOADING) {
        return '';
      }
      return this._response;
    }
  }, {
    key: "response",
    get: function get() {
      var responseType = this.responseType;
      if (responseType === '' || responseType === 'text') {
        return this.readyState < LOADING || this._hasError ? '' : this._response;
      }
      if (this.readyState !== DONE) {
        return null;
      }
      if (this._cachedResponse !== undefined) {
        return this._cachedResponse;
      }
      switch (responseType) {
        case 'document':
          this._cachedResponse = null;
          break;
        case 'arraybuffer':
          this._cachedResponse = base64.toByteArray(this._response).buffer;
          break;
        case 'blob':
          if (typeof this._response === 'object' && this._response) {
            this._cachedResponse = BlobManager.createFromOptions(this._response);
          } else if (this._response === '') {
            this._cachedResponse = BlobManager.createFromParts([]);
          } else {
            throw new Error(`Invalid response for blob: ${this._response}`);
          }
          break;
        case 'json':
          try {
            this._cachedResponse = JSON.parse(this._response);
          } catch (_) {
            this._cachedResponse = null;
          }
          break;
        default:
          this._cachedResponse = null;
      }
      return this._cachedResponse;
    }
  }, {
    key: "__didCreateRequest",
    value: function __didCreateRequest(requestId) {
      this._requestId = requestId;
      XMLHttpRequest._interceptor && XMLHttpRequest._interceptor.requestSent(requestId, this._url || '', this._method || 'GET', this._headers);
    }
  }, {
    key: "__didUploadProgress",
    value: function __didUploadProgress(requestId, progress, total) {
      if (requestId === this._requestId) {
        this.upload.dispatchEvent({
          type: 'progress',
          lengthComputable: true,
          loaded: progress,
          total: total
        });
      }
    }
  }, {
    key: "__didReceiveResponse",
    value: function __didReceiveResponse(requestId, status, responseHeaders, responseURL) {
      if (requestId === this._requestId) {
        this._perfKey != null && this._performanceLogger.stopTimespan(this._perfKey);
        this.status = status;
        this.setResponseHeaders(responseHeaders);
        this.setReadyState(this.HEADERS_RECEIVED);
        if (responseURL || responseURL === '') {
          this.responseURL = responseURL;
        } else {
          delete this.responseURL;
        }
        XMLHttpRequest._interceptor && XMLHttpRequest._interceptor.responseReceived(requestId, responseURL || this._url || '', status, responseHeaders || {});
      }
    }
  }, {
    key: "__didReceiveData",
    value: function __didReceiveData(requestId, response) {
      if (requestId !== this._requestId) {
        return;
      }
      this._response = response;
      this._cachedResponse = undefined;
      this.setReadyState(this.LOADING);
      XMLHttpRequest._interceptor && XMLHttpRequest._interceptor.dataReceived(requestId, response);
    }
  }, {
    key: "__didReceiveIncrementalData",
    value: function __didReceiveIncrementalData(requestId, responseText, progress, total) {
      if (requestId !== this._requestId) {
        return;
      }
      if (!this._response) {
        this._response = responseText;
      } else {
        this._response += responseText;
      }
      XMLHttpRequest._interceptor && XMLHttpRequest._interceptor.dataReceived(requestId, responseText);
      this.setReadyState(this.LOADING);
      this.__didReceiveDataProgress(requestId, progress, total);
    }
  }, {
    key: "__didReceiveDataProgress",
    value: function __didReceiveDataProgress(requestId, loaded, total) {
      if (requestId !== this._requestId) {
        return;
      }
      this.dispatchEvent({
        type: 'progress',
        lengthComputable: total >= 0,
        loaded: loaded,
        total: total
      });
    }
  }, {
    key: "__didCompleteResponse",
    value: function __didCompleteResponse(requestId, error, timeOutError) {
      if (requestId === this._requestId) {
        if (error) {
          if (this._responseType === '' || this._responseType === 'text') {
            this._response = error;
          }
          this._hasError = true;
          if (timeOutError) {
            this._timedOut = true;
          }
        }
        this._clearSubscriptions();
        this._requestId = null;
        this.setReadyState(this.DONE);
        if (error) {
          XMLHttpRequest._interceptor && XMLHttpRequest._interceptor.loadingFailed(requestId, error);
        } else {
          XMLHttpRequest._interceptor && XMLHttpRequest._interceptor.loadingFinished(requestId, this._response.length);
        }
      }
    }
  }, {
    key: "_clearSubscriptions",
    value: function _clearSubscriptions() {
      (this._subscriptions || []).forEach(function (sub) {
        if (sub) {
          sub.remove();
        }
      });
      this._subscriptions = [];
    }
  }, {
    key: "getAllResponseHeaders",
    value: function getAllResponseHeaders() {
      if (!this.responseHeaders) {
        return null;
      }
      var responseHeaders = this.responseHeaders;
      var unsortedHeaders = new Map();
      for (var rawHeaderName of Object.keys(responseHeaders)) {
        var headerValue = responseHeaders[rawHeaderName];
        var lowerHeaderName = rawHeaderName.toLowerCase();
        var header = unsortedHeaders.get(lowerHeaderName);
        if (header) {
          header.headerValue += ', ' + headerValue;
          unsortedHeaders.set(lowerHeaderName, header);
        } else {
          unsortedHeaders.set(lowerHeaderName, {
            lowerHeaderName: lowerHeaderName,
            upperHeaderName: rawHeaderName.toUpperCase(),
            headerValue: headerValue
          });
        }
      }
      var sortedHeaders = (0, _toConsumableArray2.default)(unsortedHeaders.values()).sort(function (a, b) {
        if (a.upperHeaderName < b.upperHeaderName) {
          return -1;
        }
        if (a.upperHeaderName > b.upperHeaderName) {
          return 1;
        }
        return 0;
      });
      return sortedHeaders.map(function (header) {
        return header.lowerHeaderName + ': ' + header.headerValue;
      }).join('\r\n') + '\r\n';
    }
  }, {
    key: "getResponseHeader",
    value: function getResponseHeader(header) {
      var value = this._lowerCaseResponseHeaders[header.toLowerCase()];
      return value !== undefined ? value : null;
    }
  }, {
    key: "setRequestHeader",
    value: function setRequestHeader(header, value) {
      if (this.readyState !== this.OPENED) {
        throw new Error('Request has not been opened');
      }
      this._headers[header.toLowerCase()] = String(value);
    }
  }, {
    key: "setTrackingName",
    value: function setTrackingName(trackingName) {
      this._trackingName = trackingName;
      return this;
    }
  }, {
    key: "setPerformanceLogger",
    value: function setPerformanceLogger(performanceLogger) {
      this._performanceLogger = performanceLogger;
      return this;
    }
  }, {
    key: "open",
    value: function open(method, url, async) {
      if (this.readyState !== this.UNSENT) {
        throw new Error('Cannot open, already sending');
      }
      if (async !== undefined && !async) {
        throw new Error('Synchronous http requests are not supported');
      }
      if (!url) {
        throw new Error('Cannot load an empty url');
      }
      this._method = method.toUpperCase();
      this._url = url;
      this._aborted = false;
      this.setReadyState(this.OPENED);
    }
  }, {
    key: "send",
    value: function send(data) {
      var _this2 = this;
      if (this.readyState !== this.OPENED) {
        throw new Error('Request has not been opened');
      }
      if (this._sent) {
        throw new Error('Request has already been sent');
      }
      this._sent = true;
      var incrementalEvents = this._incrementalEvents || !!this.onreadystatechange || !!this.onprogress;
      this._subscriptions.push(RCTNetworking.addListener('didSendNetworkData', function (args) {
        return _this2.__didUploadProgress.apply(_this2, (0, _toConsumableArray2.default)(args));
      }));
      this._subscriptions.push(RCTNetworking.addListener('didReceiveNetworkResponse', function (args) {
        return _this2.__didReceiveResponse.apply(_this2, (0, _toConsumableArray2.default)(args));
      }));
      this._subscriptions.push(RCTNetworking.addListener('didReceiveNetworkData', function (args) {
        return _this2.__didReceiveData.apply(_this2, (0, _toConsumableArray2.default)(args));
      }));
      this._subscriptions.push(RCTNetworking.addListener('didReceiveNetworkIncrementalData', function (args) {
        return _this2.__didReceiveIncrementalData.apply(_this2, (0, _toConsumableArray2.default)(args));
      }));
      this._subscriptions.push(RCTNetworking.addListener('didReceiveNetworkDataProgress', function (args) {
        return _this2.__didReceiveDataProgress.apply(_this2, (0, _toConsumableArray2.default)(args));
      }));
      this._subscriptions.push(RCTNetworking.addListener('didCompleteNetworkResponse', function (args) {
        return _this2.__didCompleteResponse.apply(_this2, (0, _toConsumableArray2.default)(args));
      }));
      var nativeResponseType = 'text';
      if (this._responseType === 'arraybuffer') {
        nativeResponseType = 'base64';
      }
      if (this._responseType === 'blob') {
        nativeResponseType = 'blob';
      }
      var doSend = function doSend() {
        var friendlyName = _this2._trackingName !== 'unknown' ? _this2._trackingName : _this2._url;
        _this2._perfKey = 'network_XMLHttpRequest_' + String(friendlyName);
        _this2._performanceLogger.startTimespan(_this2._perfKey);
        invariant(_this2._method, 'XMLHttpRequest method needs to be defined (%s).', friendlyName);
        invariant(_this2._url, 'XMLHttpRequest URL needs to be defined (%s).', friendlyName);
        RCTNetworking.sendRequest(_this2._method, _this2._trackingName, _this2._url, _this2._headers, data, nativeResponseType, incrementalEvents, _this2.timeout, _this2.__didCreateRequest.bind(_this2), _this2.withCredentials);
      };
      if (DEBUG_NETWORK_SEND_DELAY) {
        setTimeout(doSend, DEBUG_NETWORK_SEND_DELAY);
      } else {
        doSend();
      }
    }
  }, {
    key: "abort",
    value: function abort() {
      this._aborted = true;
      if (this._requestId) {
        RCTNetworking.abortRequest(this._requestId);
      }
      if (!(this.readyState === this.UNSENT || this.readyState === this.OPENED && !this._sent || this.readyState === this.DONE)) {
        this._reset();
        this.setReadyState(this.DONE);
      }
      this._reset();
    }
  }, {
    key: "setResponseHeaders",
    value: function setResponseHeaders(responseHeaders) {
      this.responseHeaders = responseHeaders || null;
      var headers = responseHeaders || {};
      this._lowerCaseResponseHeaders = Object.keys(headers).reduce(function (lcaseHeaders, headerName) {
        lcaseHeaders[headerName.toLowerCase()] = headers[headerName];
        return lcaseHeaders;
      }, {});
    }
  }, {
    key: "setReadyState",
    value: function setReadyState(newState) {
      this.readyState = newState;
      this.dispatchEvent({
        type: 'readystatechange'
      });
      if (newState === this.DONE) {
        if (this._aborted) {
          this.dispatchEvent({
            type: 'abort'
          });
        } else if (this._hasError) {
          if (this._timedOut) {
            this.dispatchEvent({
              type: 'timeout'
            });
          } else {
            this.dispatchEvent({
              type: 'error'
            });
          }
        } else {
          this.dispatchEvent({
            type: 'load'
          });
        }
        this.dispatchEvent({
          type: 'loadend'
        });
      }
    }
  }, {
    key: "addEventListener",
    value: function addEventListener(type, listener) {
      if (type === 'readystatechange' || type === 'progress') {
        this._incrementalEvents = true;
      }
      (0, _get2.default)((0, _getPrototypeOf2.default)(XMLHttpRequest.prototype), "addEventListener", this).call(this, type, listener);
    }
  }], [{
    key: "setInterceptor",
    value: function setInterceptor(interceptor) {
      XMLHttpRequest._interceptor = interceptor;
    }
  }]);
  return XMLHttpRequest;
}(EventTarget.apply(void 0, (0, _toConsumableArray2.default)(XHR_EVENTS)));
XMLHttpRequest.UNSENT = UNSENT;
XMLHttpRequest.OPENED = OPENED;
XMLHttpRequest.HEADERS_RECEIVED = HEADERS_RECEIVED;
XMLHttpRequest.LOADING = LOADING;
XMLHttpRequest.DONE = DONE;
XMLHttpRequest._interceptor = null;
module.exports = XMLHttpRequest;