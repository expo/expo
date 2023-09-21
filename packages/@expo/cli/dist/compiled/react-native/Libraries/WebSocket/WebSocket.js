var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _Blob = _interopRequireDefault(require("../Blob/Blob"));
var _BlobManager = _interopRequireDefault(require("../Blob/BlobManager"));
var _NativeEventEmitter = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _binaryToBase = _interopRequireDefault(require("../Utilities/binaryToBase64"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _NativeWebSocketModule = _interopRequireDefault(require("./NativeWebSocketModule"));
var _WebSocketEvent = _interopRequireDefault(require("./WebSocketEvent"));
var _base64Js = _interopRequireDefault(require("base64-js"));
var _eventTargetShim = _interopRequireDefault(require("event-target-shim"));
var _invariant = _interopRequireDefault(require("invariant"));
var _excluded = ["headers"];
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var CONNECTING = 0;
var OPEN = 1;
var CLOSING = 2;
var CLOSED = 3;
var CLOSE_NORMAL = 1000;
var CLOSE_ABNORMAL = 1006;
var WEBSOCKET_EVENTS = ['close', 'error', 'message', 'open'];
var nextWebSocketId = 0;
var WebSocket = function (_ref) {
  (0, _inherits2.default)(WebSocket, _ref);
  var _super = _createSuper(WebSocket);
  function WebSocket(url, protocols, options) {
    var _this;
    (0, _classCallCheck2.default)(this, WebSocket);
    _this = _super.call(this);
    _this.CONNECTING = CONNECTING;
    _this.OPEN = OPEN;
    _this.CLOSING = CLOSING;
    _this.CLOSED = CLOSED;
    _this.readyState = CONNECTING;
    _this.url = url;
    if (typeof protocols === 'string') {
      protocols = [protocols];
    }
    var _ref2 = options || {},
      _ref2$headers = _ref2.headers,
      headers = _ref2$headers === void 0 ? {} : _ref2$headers,
      unrecognized = (0, _objectWithoutProperties2.default)(_ref2, _excluded);
    if (unrecognized && typeof unrecognized.origin === 'string') {
      console.warn('Specifying `origin` as a WebSocket connection option is deprecated. Include it under `headers` instead.');
      headers.origin = unrecognized.origin;
      delete unrecognized.origin;
    }
    if (Object.keys(unrecognized).length > 0) {
      console.warn('Unrecognized WebSocket connection option(s) `' + Object.keys(unrecognized).join('`, `') + '`. ' + 'Did you mean to put these under `headers`?');
    }
    if (!Array.isArray(protocols)) {
      protocols = null;
    }
    _this._eventEmitter = new _NativeEventEmitter.default(_Platform.default.OS !== 'ios' ? null : _NativeWebSocketModule.default);
    _this._socketId = nextWebSocketId++;
    _this._registerEvents();
    _NativeWebSocketModule.default.connect(url, protocols, {
      headers: headers
    }, _this._socketId);
    return _this;
  }
  (0, _createClass2.default)(WebSocket, [{
    key: "binaryType",
    get: function get() {
      return this._binaryType;
    },
    set: function set(binaryType) {
      if (binaryType !== 'blob' && binaryType !== 'arraybuffer') {
        throw new Error("binaryType must be either 'blob' or 'arraybuffer'");
      }
      if (this._binaryType === 'blob' || binaryType === 'blob') {
        (0, _invariant.default)(_BlobManager.default.isAvailable, 'Native module BlobModule is required for blob support');
        if (binaryType === 'blob') {
          _BlobManager.default.addWebSocketHandler(this._socketId);
        } else {
          _BlobManager.default.removeWebSocketHandler(this._socketId);
        }
      }
      this._binaryType = binaryType;
    }
  }, {
    key: "close",
    value: function close(code, reason) {
      if (this.readyState === this.CLOSING || this.readyState === this.CLOSED) {
        return;
      }
      this.readyState = this.CLOSING;
      this._close(code, reason);
    }
  }, {
    key: "send",
    value: function send(data) {
      if (this.readyState === this.CONNECTING) {
        throw new Error('INVALID_STATE_ERR');
      }
      if (data instanceof _Blob.default) {
        (0, _invariant.default)(_BlobManager.default.isAvailable, 'Native module BlobModule is required for blob support');
        _BlobManager.default.sendOverSocket(data, this._socketId);
        return;
      }
      if (typeof data === 'string') {
        _NativeWebSocketModule.default.send(data, this._socketId);
        return;
      }
      if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        _NativeWebSocketModule.default.sendBinary((0, _binaryToBase.default)(data), this._socketId);
        return;
      }
      throw new Error('Unsupported data type');
    }
  }, {
    key: "ping",
    value: function ping() {
      if (this.readyState === this.CONNECTING) {
        throw new Error('INVALID_STATE_ERR');
      }
      _NativeWebSocketModule.default.ping(this._socketId);
    }
  }, {
    key: "_close",
    value: function _close(code, reason) {
      var statusCode = typeof code === 'number' ? code : CLOSE_NORMAL;
      var closeReason = typeof reason === 'string' ? reason : '';
      _NativeWebSocketModule.default.close(statusCode, closeReason, this._socketId);
      if (_BlobManager.default.isAvailable && this._binaryType === 'blob') {
        _BlobManager.default.removeWebSocketHandler(this._socketId);
      }
    }
  }, {
    key: "_unregisterEvents",
    value: function _unregisterEvents() {
      this._subscriptions.forEach(function (e) {
        return e.remove();
      });
      this._subscriptions = [];
    }
  }, {
    key: "_registerEvents",
    value: function _registerEvents() {
      var _this2 = this;
      this._subscriptions = [this._eventEmitter.addListener('websocketMessage', function (ev) {
        if (ev.id !== _this2._socketId) {
          return;
        }
        var data = ev.data;
        switch (ev.type) {
          case 'binary':
            data = _base64Js.default.toByteArray(ev.data).buffer;
            break;
          case 'blob':
            data = _BlobManager.default.createFromOptions(ev.data);
            break;
        }
        _this2.dispatchEvent(new _WebSocketEvent.default('message', {
          data: data
        }));
      }), this._eventEmitter.addListener('websocketOpen', function (ev) {
        if (ev.id !== _this2._socketId) {
          return;
        }
        _this2.readyState = _this2.OPEN;
        _this2.protocol = ev.protocol;
        _this2.dispatchEvent(new _WebSocketEvent.default('open'));
      }), this._eventEmitter.addListener('websocketClosed', function (ev) {
        if (ev.id !== _this2._socketId) {
          return;
        }
        _this2.readyState = _this2.CLOSED;
        _this2.dispatchEvent(new _WebSocketEvent.default('close', {
          code: ev.code,
          reason: ev.reason
        }));
        _this2._unregisterEvents();
        _this2.close();
      }), this._eventEmitter.addListener('websocketFailed', function (ev) {
        if (ev.id !== _this2._socketId) {
          return;
        }
        _this2.readyState = _this2.CLOSED;
        _this2.dispatchEvent(new _WebSocketEvent.default('error', {
          message: ev.message
        }));
        _this2.dispatchEvent(new _WebSocketEvent.default('close', {
          code: CLOSE_ABNORMAL,
          reason: ev.message
        }));
        _this2._unregisterEvents();
        _this2.close();
      })];
    }
  }]);
  return WebSocket;
}(_eventTargetShim.default.apply(void 0, WEBSOCKET_EVENTS));
WebSocket.CONNECTING = CONNECTING;
WebSocket.OPEN = OPEN;
WebSocket.CLOSING = CLOSING;
WebSocket.CLOSED = CLOSED;
module.exports = WebSocket;