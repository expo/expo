var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeEventEmitter = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _NativeWebSocketModule = _interopRequireDefault(require("./NativeWebSocketModule"));
var _base64Js = _interopRequireDefault(require("base64-js"));
var originalRCTWebSocketConnect = _NativeWebSocketModule.default.connect;
var originalRCTWebSocketSend = _NativeWebSocketModule.default.send;
var originalRCTWebSocketSendBinary = _NativeWebSocketModule.default.sendBinary;
var originalRCTWebSocketClose = _NativeWebSocketModule.default.close;
var eventEmitter;
var subscriptions;
var closeCallback;
var sendCallback;
var connectCallback;
var onOpenCallback;
var onMessageCallback;
var onErrorCallback;
var onCloseCallback;
var _isInterceptorEnabled = false;
var WebSocketInterceptor = {
  setCloseCallback: function setCloseCallback(callback) {
    closeCallback = callback;
  },
  setSendCallback: function setSendCallback(callback) {
    sendCallback = callback;
  },
  setConnectCallback: function setConnectCallback(callback) {
    connectCallback = callback;
  },
  setOnOpenCallback: function setOnOpenCallback(callback) {
    onOpenCallback = callback;
  },
  setOnMessageCallback: function setOnMessageCallback(callback) {
    onMessageCallback = callback;
  },
  setOnErrorCallback: function setOnErrorCallback(callback) {
    onErrorCallback = callback;
  },
  setOnCloseCallback: function setOnCloseCallback(callback) {
    onCloseCallback = callback;
  },
  isInterceptorEnabled: function isInterceptorEnabled() {
    return _isInterceptorEnabled;
  },
  _unregisterEvents: function _unregisterEvents() {
    subscriptions.forEach(function (e) {
      return e.remove();
    });
    subscriptions = [];
  },
  _registerEvents: function _registerEvents() {
    subscriptions = [eventEmitter.addListener('websocketMessage', function (ev) {
      if (onMessageCallback) {
        onMessageCallback(ev.id, ev.type === 'binary' ? WebSocketInterceptor._arrayBufferToString(ev.data) : ev.data);
      }
    }), eventEmitter.addListener('websocketOpen', function (ev) {
      if (onOpenCallback) {
        onOpenCallback(ev.id);
      }
    }), eventEmitter.addListener('websocketClosed', function (ev) {
      if (onCloseCallback) {
        onCloseCallback(ev.id, {
          code: ev.code,
          reason: ev.reason
        });
      }
    }), eventEmitter.addListener('websocketFailed', function (ev) {
      if (onErrorCallback) {
        onErrorCallback(ev.id, {
          message: ev.message
        });
      }
    })];
  },
  enableInterception: function enableInterception() {
    if (_isInterceptorEnabled) {
      return;
    }
    eventEmitter = new _NativeEventEmitter.default(_Platform.default.OS !== 'ios' ? null : _NativeWebSocketModule.default);
    WebSocketInterceptor._registerEvents();
    _NativeWebSocketModule.default.connect = function (url, protocols, options, socketId) {
      if (connectCallback) {
        connectCallback(url, protocols, options, socketId);
      }
      originalRCTWebSocketConnect.apply(this, arguments);
    };
    _NativeWebSocketModule.default.send = function (data, socketId) {
      if (sendCallback) {
        sendCallback(data, socketId);
      }
      originalRCTWebSocketSend.apply(this, arguments);
    };
    _NativeWebSocketModule.default.sendBinary = function (data, socketId) {
      if (sendCallback) {
        sendCallback(WebSocketInterceptor._arrayBufferToString(data), socketId);
      }
      originalRCTWebSocketSendBinary.apply(this, arguments);
    };
    _NativeWebSocketModule.default.close = function () {
      if (closeCallback) {
        if (arguments.length === 3) {
          closeCallback(arguments[0], arguments[1], arguments[2]);
        } else {
          closeCallback(null, null, arguments[0]);
        }
      }
      originalRCTWebSocketClose.apply(this, arguments);
    };
    _isInterceptorEnabled = true;
  },
  _arrayBufferToString: function _arrayBufferToString(data) {
    var value = _base64Js.default.toByteArray(data).buffer;
    if (value === undefined || value === null) {
      return '(no value)';
    }
    if (typeof ArrayBuffer !== 'undefined' && typeof Uint8Array !== 'undefined' && value instanceof ArrayBuffer) {
      return `ArrayBuffer {${String(Array.from(new Uint8Array(value)))}}`;
    }
    return value;
  },
  disableInterception: function disableInterception() {
    if (!_isInterceptorEnabled) {
      return;
    }
    _isInterceptorEnabled = false;
    _NativeWebSocketModule.default.send = originalRCTWebSocketSend;
    _NativeWebSocketModule.default.sendBinary = originalRCTWebSocketSendBinary;
    _NativeWebSocketModule.default.close = originalRCTWebSocketClose;
    _NativeWebSocketModule.default.connect = originalRCTWebSocketConnect;
    connectCallback = null;
    closeCallback = null;
    sendCallback = null;
    onOpenCallback = null;
    onMessageCallback = null;
    onCloseCallback = null;
    onErrorCallback = null;
    WebSocketInterceptor._unregisterEvents();
  }
};
module.exports = WebSocketInterceptor;
//# sourceMappingURL=WebSocketInterceptor.js.map