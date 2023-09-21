'use strict';

var XMLHttpRequest = require('./XMLHttpRequest');
var originalXHROpen = XMLHttpRequest.prototype.open;
var originalXHRSend = XMLHttpRequest.prototype.send;
var originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
var openCallback;
var sendCallback;
var requestHeaderCallback;
var headerReceivedCallback;
var responseCallback;
var _isInterceptorEnabled = false;
var XHRInterceptor = {
  setOpenCallback: function setOpenCallback(callback) {
    openCallback = callback;
  },
  setSendCallback: function setSendCallback(callback) {
    sendCallback = callback;
  },
  setHeaderReceivedCallback: function setHeaderReceivedCallback(callback) {
    headerReceivedCallback = callback;
  },
  setResponseCallback: function setResponseCallback(callback) {
    responseCallback = callback;
  },
  setRequestHeaderCallback: function setRequestHeaderCallback(callback) {
    requestHeaderCallback = callback;
  },
  isInterceptorEnabled: function isInterceptorEnabled() {
    return _isInterceptorEnabled;
  },
  enableInterception: function enableInterception() {
    if (_isInterceptorEnabled) {
      return;
    }
    XMLHttpRequest.prototype.open = function (method, url) {
      if (openCallback) {
        openCallback(method, url, this);
      }
      originalXHROpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
      if (requestHeaderCallback) {
        requestHeaderCallback(header, value, this);
      }
      originalXHRSetRequestHeader.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (data) {
      var _this = this;
      if (sendCallback) {
        sendCallback(data, this);
      }
      if (this.addEventListener) {
        this.addEventListener('readystatechange', function () {
          if (!_isInterceptorEnabled) {
            return;
          }
          if (_this.readyState === _this.HEADERS_RECEIVED) {
            var contentTypeString = _this.getResponseHeader('Content-Type');
            var contentLengthString = _this.getResponseHeader('Content-Length');
            var responseContentType, responseSize;
            if (contentTypeString) {
              responseContentType = contentTypeString.split(';')[0];
            }
            if (contentLengthString) {
              responseSize = parseInt(contentLengthString, 10);
            }
            if (headerReceivedCallback) {
              headerReceivedCallback(responseContentType, responseSize, _this.getAllResponseHeaders(), _this);
            }
          }
          if (_this.readyState === _this.DONE) {
            if (responseCallback) {
              responseCallback(_this.status, _this.timeout, _this.response, _this.responseURL, _this.responseType, _this);
            }
          }
        }, false);
      }
      originalXHRSend.apply(this, arguments);
    };
    _isInterceptorEnabled = true;
  },
  disableInterception: function disableInterception() {
    if (!_isInterceptorEnabled) {
      return;
    }
    _isInterceptorEnabled = false;
    XMLHttpRequest.prototype.send = originalXHRSend;
    XMLHttpRequest.prototype.open = originalXHROpen;
    XMLHttpRequest.prototype.setRequestHeader = originalXHRSetRequestHeader;
    responseCallback = null;
    openCallback = null;
    sendCallback = null;
    headerReceivedCallback = null;
    requestHeaderCallback = null;
  }
};
module.exports = XHRInterceptor;