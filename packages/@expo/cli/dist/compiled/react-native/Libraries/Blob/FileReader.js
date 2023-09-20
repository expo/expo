var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _NativeFileReaderModule = _interopRequireDefault(require("./NativeFileReaderModule"));
var _base64Js = require("base64-js");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var EventTarget = require('event-target-shim');
var READER_EVENTS = ['abort', 'error', 'load', 'loadstart', 'loadend', 'progress'];
var EMPTY = 0;
var LOADING = 1;
var DONE = 2;
var FileReader = function (_ref) {
  (0, _inherits2.default)(FileReader, _ref);
  var _super = _createSuper(FileReader);
  function FileReader() {
    var _this;
    (0, _classCallCheck2.default)(this, FileReader);
    _this = _super.call(this);
    _this.EMPTY = EMPTY;
    _this.LOADING = LOADING;
    _this.DONE = DONE;
    _this._aborted = false;
    _this._reset();
    return _this;
  }
  (0, _createClass2.default)(FileReader, [{
    key: "_reset",
    value: function _reset() {
      this._readyState = EMPTY;
      this._error = null;
      this._result = null;
    }
  }, {
    key: "_setReadyState",
    value: function _setReadyState(newState) {
      this._readyState = newState;
      this.dispatchEvent({
        type: 'readystatechange'
      });
      if (newState === DONE) {
        if (this._aborted) {
          this.dispatchEvent({
            type: 'abort'
          });
        } else if (this._error) {
          this.dispatchEvent({
            type: 'error'
          });
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
    key: "readAsArrayBuffer",
    value: function readAsArrayBuffer(blob) {
      var _this2 = this;
      this._aborted = false;
      if (blob == null) {
        throw new TypeError("Failed to execute 'readAsArrayBuffer' on 'FileReader': parameter 1 is not of type 'Blob'");
      }
      _NativeFileReaderModule.default.readAsDataURL(blob.data).then(function (text) {
        if (_this2._aborted) {
          return;
        }
        var base64 = text.split(',')[1];
        var typedArray = (0, _base64Js.toByteArray)(base64);
        _this2._result = typedArray.buffer;
        _this2._setReadyState(DONE);
      }, function (error) {
        if (_this2._aborted) {
          return;
        }
        _this2._error = error;
        _this2._setReadyState(DONE);
      });
    }
  }, {
    key: "readAsDataURL",
    value: function readAsDataURL(blob) {
      var _this3 = this;
      this._aborted = false;
      if (blob == null) {
        throw new TypeError("Failed to execute 'readAsDataURL' on 'FileReader': parameter 1 is not of type 'Blob'");
      }
      _NativeFileReaderModule.default.readAsDataURL(blob.data).then(function (text) {
        if (_this3._aborted) {
          return;
        }
        _this3._result = text;
        _this3._setReadyState(DONE);
      }, function (error) {
        if (_this3._aborted) {
          return;
        }
        _this3._error = error;
        _this3._setReadyState(DONE);
      });
    }
  }, {
    key: "readAsText",
    value: function readAsText(blob) {
      var _this4 = this;
      var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'UTF-8';
      this._aborted = false;
      if (blob == null) {
        throw new TypeError("Failed to execute 'readAsText' on 'FileReader': parameter 1 is not of type 'Blob'");
      }
      _NativeFileReaderModule.default.readAsText(blob.data, encoding).then(function (text) {
        if (_this4._aborted) {
          return;
        }
        _this4._result = text;
        _this4._setReadyState(DONE);
      }, function (error) {
        if (_this4._aborted) {
          return;
        }
        _this4._error = error;
        _this4._setReadyState(DONE);
      });
    }
  }, {
    key: "abort",
    value: function abort() {
      this._aborted = true;
      if (this._readyState !== EMPTY && this._readyState !== DONE) {
        this._reset();
        this._setReadyState(DONE);
      }
      this._reset();
    }
  }, {
    key: "readyState",
    get: function get() {
      return this._readyState;
    }
  }, {
    key: "error",
    get: function get() {
      return this._error;
    }
  }, {
    key: "result",
    get: function get() {
      return this._result;
    }
  }]);
  return FileReader;
}(EventTarget.apply(void 0, READER_EVENTS));
FileReader.EMPTY = EMPTY;
FileReader.LOADING = LOADING;
FileReader.DONE = DONE;
module.exports = FileReader;
//# sourceMappingURL=FileReader.js.map