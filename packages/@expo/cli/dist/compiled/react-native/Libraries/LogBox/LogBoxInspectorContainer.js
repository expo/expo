var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports._LogBoxInspectorContainer = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _View = _interopRequireDefault(require("../Components/View/View"));
var _StyleSheet = _interopRequireDefault(require("../StyleSheet/StyleSheet"));
var LogBoxData = _interopRequireWildcard(require("./Data/LogBoxData"));
var _LogBoxInspector = _interopRequireDefault(require("./UI/LogBoxInspector"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var _LogBoxInspectorContainer = function (_React$Component) {
  (0, _inherits2.default)(_LogBoxInspectorContainer, _React$Component);
  var _super = _createSuper(_LogBoxInspectorContainer);
  function _LogBoxInspectorContainer() {
    var _this;
    (0, _classCallCheck2.default)(this, _LogBoxInspectorContainer);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this._handleDismiss = function () {
      var _this$props = _this.props,
        selectedLogIndex = _this$props.selectedLogIndex,
        logs = _this$props.logs;
      var logsArray = Array.from(logs);
      if (selectedLogIndex != null) {
        if (logsArray.length - 1 <= 0) {
          LogBoxData.setSelectedLog(-1);
        } else if (selectedLogIndex >= logsArray.length - 1) {
          LogBoxData.setSelectedLog(selectedLogIndex - 1);
        }
        LogBoxData.dismiss(logsArray[selectedLogIndex]);
      }
    };
    _this._handleMinimize = function () {
      LogBoxData.setSelectedLog(-1);
    };
    _this._handleSetSelectedLog = function (index) {
      LogBoxData.setSelectedLog(index);
    };
    return _this;
  }
  (0, _createClass2.default)(_LogBoxInspectorContainer, [{
    key: "render",
    value: function render() {
      return (0, _jsxRuntime.jsx)(_View.default, {
        style: _StyleSheet.default.absoluteFill,
        children: (0, _jsxRuntime.jsx)(_LogBoxInspector.default, {
          onDismiss: this._handleDismiss,
          onMinimize: this._handleMinimize,
          onChangeSelectedIndex: this._handleSetSelectedLog,
          logs: this.props.logs,
          selectedIndex: this.props.selectedLogIndex
        })
      });
    }
  }]);
  return _LogBoxInspectorContainer;
}(React.Component);
exports._LogBoxInspectorContainer = _LogBoxInspectorContainer;
var _default = LogBoxData.withSubscription(_LogBoxInspectorContainer);
exports.default = _default;