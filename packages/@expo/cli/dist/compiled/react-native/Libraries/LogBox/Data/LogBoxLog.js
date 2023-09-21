var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var LogBoxSymbolication = _interopRequireWildcard(require("./LogBoxSymbolication"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var LogBoxLog = function () {
  function LogBoxLog(data) {
    (0, _classCallCheck2.default)(this, LogBoxLog);
    this.symbolicated = {
      error: null,
      stack: null,
      status: 'NONE'
    };
    this.level = data.level;
    this.type = data.type;
    this.message = data.message;
    this.stack = data.stack;
    this.category = data.category;
    this.componentStack = data.componentStack;
    this.codeFrame = data.codeFrame;
    this.isComponentError = data.isComponentError;
    this.count = 1;
  }
  (0, _createClass2.default)(LogBoxLog, [{
    key: "incrementCount",
    value: function incrementCount() {
      this.count += 1;
    }
  }, {
    key: "getAvailableStack",
    value: function getAvailableStack() {
      return this.symbolicated.status === 'COMPLETE' ? this.symbolicated.stack : this.stack;
    }
  }, {
    key: "retrySymbolicate",
    value: function retrySymbolicate(callback) {
      if (this.symbolicated.status !== 'COMPLETE') {
        LogBoxSymbolication.deleteStack(this.stack);
        this.handleSymbolicate(callback);
      }
    }
  }, {
    key: "symbolicate",
    value: function symbolicate(callback) {
      if (this.symbolicated.status === 'NONE') {
        this.handleSymbolicate(callback);
      }
    }
  }, {
    key: "handleSymbolicate",
    value: function handleSymbolicate(callback) {
      var _this = this;
      if (this.symbolicated.status !== 'PENDING') {
        this.updateStatus(null, null, null, callback);
        LogBoxSymbolication.symbolicate(this.stack).then(function (data) {
          _this.updateStatus(null, data == null ? void 0 : data.stack, data == null ? void 0 : data.codeFrame, callback);
        }, function (error) {
          _this.updateStatus(error, null, null, callback);
        });
      }
    }
  }, {
    key: "updateStatus",
    value: function updateStatus(error, stack, codeFrame, callback) {
      var lastStatus = this.symbolicated.status;
      if (error != null) {
        this.symbolicated = {
          error: error,
          stack: null,
          status: 'FAILED'
        };
      } else if (stack != null) {
        if (codeFrame) {
          this.codeFrame = codeFrame;
        }
        this.symbolicated = {
          error: null,
          stack: stack,
          status: 'COMPLETE'
        };
      } else {
        this.symbolicated = {
          error: null,
          stack: null,
          status: 'PENDING'
        };
      }
      if (callback && lastStatus !== this.symbolicated.status) {
        callback(this.symbolicated.status);
      }
    }
  }]);
  return LogBoxLog;
}();
var _default = LogBoxLog;
exports.default = _default;