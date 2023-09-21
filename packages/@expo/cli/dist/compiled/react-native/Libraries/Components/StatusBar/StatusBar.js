var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _processColor = _interopRequireDefault(require("../../StyleSheet/processColor"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _NativeStatusBarManagerAndroid = _interopRequireDefault(require("./NativeStatusBarManagerAndroid"));
var _NativeStatusBarManagerIOS = _interopRequireDefault(require("./NativeStatusBarManagerIOS"));
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
var _NativeStatusBarManag;
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function mergePropsStack(propsStack, defaultValues) {
  return propsStack.reduce(function (prev, cur) {
    for (var prop in cur) {
      if (cur[prop] != null) {
        prev[prop] = cur[prop];
      }
    }
    return prev;
  }, Object.assign({}, defaultValues));
}
function createStackEntry(props) {
  var _props$animated, _props$showHideTransi;
  var animated = (_props$animated = props.animated) != null ? _props$animated : false;
  var showHideTransition = (_props$showHideTransi = props.showHideTransition) != null ? _props$showHideTransi : 'fade';
  return {
    backgroundColor: props.backgroundColor != null ? {
      value: props.backgroundColor,
      animated: animated
    } : null,
    barStyle: props.barStyle != null ? {
      value: props.barStyle,
      animated: animated
    } : null,
    translucent: props.translucent,
    hidden: props.hidden != null ? {
      value: props.hidden,
      animated: animated,
      transition: showHideTransition
    } : null,
    networkActivityIndicatorVisible: props.networkActivityIndicatorVisible
  };
}
var StatusBar = function (_React$Component) {
  (0, _inherits2.default)(StatusBar, _React$Component);
  var _super = _createSuper(StatusBar);
  function StatusBar() {
    var _this;
    (0, _classCallCheck2.default)(this, StatusBar);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this._stackEntry = null;
    return _this;
  }
  (0, _createClass2.default)(StatusBar, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this._stackEntry = StatusBar.pushStackEntry(this.props);
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      StatusBar.popStackEntry(this._stackEntry);
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      this._stackEntry = StatusBar.replaceStackEntry(this._stackEntry, this.props);
    }
  }, {
    key: "render",
    value: function render() {
      return null;
    }
  }], [{
    key: "setHidden",
    value: function setHidden(hidden, animation) {
      animation = animation || 'none';
      StatusBar._defaultProps.hidden.value = hidden;
      if (_Platform.default.OS === 'ios') {
        _NativeStatusBarManagerIOS.default.setHidden(hidden, animation);
      } else if (_Platform.default.OS === 'android') {
        _NativeStatusBarManagerAndroid.default.setHidden(hidden);
      }
    }
  }, {
    key: "setBarStyle",
    value: function setBarStyle(style, animated) {
      animated = animated || false;
      StatusBar._defaultProps.barStyle.value = style;
      if (_Platform.default.OS === 'ios') {
        _NativeStatusBarManagerIOS.default.setStyle(style, animated);
      } else if (_Platform.default.OS === 'android') {
        _NativeStatusBarManagerAndroid.default.setStyle(style);
      }
    }
  }, {
    key: "setNetworkActivityIndicatorVisible",
    value: function setNetworkActivityIndicatorVisible(visible) {
      if (_Platform.default.OS !== 'ios') {
        console.warn('`setNetworkActivityIndicatorVisible` is only available on iOS');
        return;
      }
      StatusBar._defaultProps.networkActivityIndicatorVisible = visible;
      _NativeStatusBarManagerIOS.default.setNetworkActivityIndicatorVisible(visible);
    }
  }, {
    key: "setBackgroundColor",
    value: function setBackgroundColor(color, animated) {
      if (_Platform.default.OS !== 'android') {
        console.warn('`setBackgroundColor` is only available on Android');
        return;
      }
      animated = animated || false;
      StatusBar._defaultProps.backgroundColor.value = color;
      var processedColor = (0, _processColor.default)(color);
      if (processedColor == null) {
        console.warn(`\`StatusBar.setBackgroundColor\`: Color ${color} parsed to null or undefined`);
        return;
      }
      (0, _invariant.default)(typeof processedColor === 'number', 'Unexpected color given for StatusBar.setBackgroundColor');
      _NativeStatusBarManagerAndroid.default.setColor(processedColor, animated);
    }
  }, {
    key: "setTranslucent",
    value: function setTranslucent(translucent) {
      if (_Platform.default.OS !== 'android') {
        console.warn('`setTranslucent` is only available on Android');
        return;
      }
      StatusBar._defaultProps.translucent = translucent;
      _NativeStatusBarManagerAndroid.default.setTranslucent(translucent);
    }
  }, {
    key: "pushStackEntry",
    value: function pushStackEntry(props) {
      var entry = createStackEntry(props);
      StatusBar._propsStack.push(entry);
      StatusBar._updatePropsStack();
      return entry;
    }
  }, {
    key: "popStackEntry",
    value: function popStackEntry(entry) {
      var index = StatusBar._propsStack.indexOf(entry);
      if (index !== -1) {
        StatusBar._propsStack.splice(index, 1);
      }
      StatusBar._updatePropsStack();
    }
  }, {
    key: "replaceStackEntry",
    value: function replaceStackEntry(entry, props) {
      var newEntry = createStackEntry(props);
      var index = StatusBar._propsStack.indexOf(entry);
      if (index !== -1) {
        StatusBar._propsStack[index] = newEntry;
      }
      StatusBar._updatePropsStack();
      return newEntry;
    }
  }]);
  return StatusBar;
}(React.Component);
StatusBar._propsStack = [];
StatusBar._defaultProps = createStackEntry({
  backgroundColor: _Platform.default.OS === 'android' ? (_NativeStatusBarManag = _NativeStatusBarManagerAndroid.default.getConstants().DEFAULT_BACKGROUND_COLOR) != null ? _NativeStatusBarManag : 'black' : 'black',
  barStyle: 'default',
  translucent: false,
  hidden: false,
  networkActivityIndicatorVisible: false
});
StatusBar._updateImmediate = null;
StatusBar._currentValues = null;
StatusBar.currentHeight = _Platform.default.OS === 'android' ? _NativeStatusBarManagerAndroid.default.getConstants().HEIGHT : null;
StatusBar._updatePropsStack = function () {
  clearImmediate(StatusBar._updateImmediate);
  StatusBar._updateImmediate = setImmediate(function () {
    var oldProps = StatusBar._currentValues;
    var mergedProps = mergePropsStack(StatusBar._propsStack, StatusBar._defaultProps);
    if (_Platform.default.OS === 'ios') {
      if (!oldProps || oldProps.barStyle.value !== mergedProps.barStyle.value) {
        _NativeStatusBarManagerIOS.default.setStyle(mergedProps.barStyle.value, mergedProps.barStyle.animated || false);
      }
      if (!oldProps || oldProps.hidden.value !== mergedProps.hidden.value) {
        _NativeStatusBarManagerIOS.default.setHidden(mergedProps.hidden.value, mergedProps.hidden.animated ? mergedProps.hidden.transition : 'none');
      }
      if (!oldProps || oldProps.networkActivityIndicatorVisible !== mergedProps.networkActivityIndicatorVisible) {
        _NativeStatusBarManagerIOS.default.setNetworkActivityIndicatorVisible(mergedProps.networkActivityIndicatorVisible);
      }
    } else if (_Platform.default.OS === 'android') {
      _NativeStatusBarManagerAndroid.default.setStyle(mergedProps.barStyle.value);
      var processedColor = (0, _processColor.default)(mergedProps.backgroundColor.value);
      if (processedColor == null) {
        console.warn(`\`StatusBar._updatePropsStack\`: Color ${mergedProps.backgroundColor.value} parsed to null or undefined`);
      } else {
        (0, _invariant.default)(typeof processedColor === 'number', 'Unexpected color given in StatusBar._updatePropsStack');
        _NativeStatusBarManagerAndroid.default.setColor(processedColor, mergedProps.backgroundColor.animated);
      }
      if (!oldProps || oldProps.hidden.value !== mergedProps.hidden.value) {
        _NativeStatusBarManagerAndroid.default.setHidden(mergedProps.hidden.value);
      }
      if (!oldProps || oldProps.translucent !== mergedProps.translucent || mergedProps.translucent) {
        _NativeStatusBarManagerAndroid.default.setTranslucent(mergedProps.translucent);
      }
    }
    StatusBar._currentValues = mergedProps;
  });
};
module.exports = StatusBar;