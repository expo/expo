var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _AndroidSwipeRefreshLayoutNativeComponent = _interopRequireWildcard(require("./AndroidSwipeRefreshLayoutNativeComponent"));
var _PullToRefreshViewNativeComponent = _interopRequireWildcard(require("./PullToRefreshViewNativeComponent"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["enabled", "colors", "progressBackgroundColor", "size"],
  _excluded2 = ["tintColor", "titleColor", "title"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var Platform = require("../../Utilities/Platform");
var React = require('react');
var RefreshControl = function (_React$Component) {
  (0, _inherits2.default)(RefreshControl, _React$Component);
  var _super = _createSuper(RefreshControl);
  function RefreshControl() {
    var _this;
    (0, _classCallCheck2.default)(this, RefreshControl);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this._lastNativeRefreshing = false;
    _this._onRefresh = function () {
      _this._lastNativeRefreshing = true;
      _this.props.onRefresh && _this.props.onRefresh();
      _this.forceUpdate();
    };
    _this._setNativeRef = function (ref) {
      _this._nativeRef = ref;
    };
    return _this;
  }
  (0, _createClass2.default)(RefreshControl, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this._lastNativeRefreshing = this.props.refreshing;
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (this.props.refreshing !== prevProps.refreshing) {
        this._lastNativeRefreshing = this.props.refreshing;
      } else if (this.props.refreshing !== this._lastNativeRefreshing && this._nativeRef) {
        if (Platform.OS === 'android') {
          _AndroidSwipeRefreshLayoutNativeComponent.Commands.setNativeRefreshing(this._nativeRef, this.props.refreshing);
        } else {
          _PullToRefreshViewNativeComponent.Commands.setNativeRefreshing(this._nativeRef, this.props.refreshing);
        }
        this._lastNativeRefreshing = this.props.refreshing;
      }
    }
  }, {
    key: "render",
    value: function render() {
      if (Platform.OS === 'ios') {
        var _this$props = this.props,
          enabled = _this$props.enabled,
          colors = _this$props.colors,
          progressBackgroundColor = _this$props.progressBackgroundColor,
          size = _this$props.size,
          props = (0, _objectWithoutProperties2.default)(_this$props, _excluded);
        return (0, _jsxRuntime.jsx)(_PullToRefreshViewNativeComponent.default, Object.assign({}, props, {
          ref: this._setNativeRef,
          onRefresh: this._onRefresh
        }));
      } else {
        var _this$props2 = this.props,
          tintColor = _this$props2.tintColor,
          titleColor = _this$props2.titleColor,
          title = _this$props2.title,
          _props = (0, _objectWithoutProperties2.default)(_this$props2, _excluded2);
        return (0, _jsxRuntime.jsx)(_AndroidSwipeRefreshLayoutNativeComponent.default, Object.assign({}, _props, {
          ref: this._setNativeRef,
          onRefresh: this._onRefresh
        }));
      }
    }
  }]);
  return RefreshControl;
}(React.Component);
module.exports = RefreshControl;
//# sourceMappingURL=RefreshControl.js.map