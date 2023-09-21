var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _dismissKeyboard = _interopRequireDefault(require("../../Utilities/dismissKeyboard"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _StatusBar = _interopRequireDefault(require("../StatusBar/StatusBar"));
var _View = _interopRequireDefault(require("../View/View"));
var _AndroidDrawerLayoutNativeComponent = _interopRequireWildcard(require("./AndroidDrawerLayoutNativeComponent"));
var _nullthrows = _interopRequireDefault(require("nullthrows"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["drawerBackgroundColor", "onDrawerStateChanged", "renderNavigationView", "onDrawerOpen", "onDrawerClose"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var DRAWER_STATES = ['Idle', 'Dragging', 'Settling'];
var DrawerLayoutAndroid = function (_React$Component) {
  (0, _inherits2.default)(DrawerLayoutAndroid, _React$Component);
  var _super = _createSuper(DrawerLayoutAndroid);
  function DrawerLayoutAndroid() {
    var _this;
    (0, _classCallCheck2.default)(this, DrawerLayoutAndroid);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this._nativeRef = React.createRef();
    _this.state = {
      statusBarBackgroundColor: null
    };
    _this._onDrawerSlide = function (event) {
      if (_this.props.onDrawerSlide) {
        _this.props.onDrawerSlide(event);
      }
      if (_this.props.keyboardDismissMode === 'on-drag') {
        (0, _dismissKeyboard.default)();
      }
    };
    _this._onDrawerOpen = function () {
      if (_this.props.onDrawerOpen) {
        _this.props.onDrawerOpen();
      }
    };
    _this._onDrawerClose = function () {
      if (_this.props.onDrawerClose) {
        _this.props.onDrawerClose();
      }
    };
    _this._onDrawerStateChanged = function (event) {
      if (_this.props.onDrawerStateChanged) {
        _this.props.onDrawerStateChanged(DRAWER_STATES[event.nativeEvent.drawerState]);
      }
    };
    return _this;
  }
  (0, _createClass2.default)(DrawerLayoutAndroid, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
        _this$props$drawerBac = _this$props.drawerBackgroundColor,
        drawerBackgroundColor = _this$props$drawerBac === void 0 ? 'white' : _this$props$drawerBac,
        onDrawerStateChanged = _this$props.onDrawerStateChanged,
        renderNavigationView = _this$props.renderNavigationView,
        onDrawerOpen = _this$props.onDrawerOpen,
        onDrawerClose = _this$props.onDrawerClose,
        props = (0, _objectWithoutProperties2.default)(_this$props, _excluded);
      var drawStatusBar = _Platform.default.Version >= 21 && this.props.statusBarBackgroundColor != null;
      var drawerViewWrapper = (0, _jsxRuntime.jsxs)(_View.default, {
        style: [styles.drawerSubview, {
          width: this.props.drawerWidth,
          backgroundColor: drawerBackgroundColor
        }],
        collapsable: false,
        children: [renderNavigationView(), drawStatusBar && (0, _jsxRuntime.jsx)(_View.default, {
          style: styles.drawerStatusBar
        })]
      });
      var childrenWrapper = (0, _jsxRuntime.jsxs)(_View.default, {
        style: styles.mainSubview,
        collapsable: false,
        children: [drawStatusBar && (0, _jsxRuntime.jsx)(_StatusBar.default, {
          translucent: true,
          backgroundColor: this.props.statusBarBackgroundColor
        }), drawStatusBar && (0, _jsxRuntime.jsx)(_View.default, {
          style: [styles.statusBar, {
            backgroundColor: this.props.statusBarBackgroundColor
          }]
        }), this.props.children]
      });
      return (0, _jsxRuntime.jsxs)(_AndroidDrawerLayoutNativeComponent.default, Object.assign({}, props, {
        ref: this._nativeRef,
        drawerBackgroundColor: drawerBackgroundColor,
        drawerWidth: this.props.drawerWidth,
        drawerPosition: this.props.drawerPosition,
        drawerLockMode: this.props.drawerLockMode,
        style: [styles.base, this.props.style],
        onDrawerSlide: this._onDrawerSlide,
        onDrawerOpen: this._onDrawerOpen,
        onDrawerClose: this._onDrawerClose,
        onDrawerStateChanged: this._onDrawerStateChanged,
        children: [childrenWrapper, drawerViewWrapper]
      }));
    }
  }, {
    key: "openDrawer",
    value: function openDrawer() {
      _AndroidDrawerLayoutNativeComponent.Commands.openDrawer((0, _nullthrows.default)(this._nativeRef.current));
    }
  }, {
    key: "closeDrawer",
    value: function closeDrawer() {
      _AndroidDrawerLayoutNativeComponent.Commands.closeDrawer((0, _nullthrows.default)(this._nativeRef.current));
    }
  }, {
    key: "blur",
    value: function blur() {
      (0, _nullthrows.default)(this._nativeRef.current).blur();
    }
  }, {
    key: "focus",
    value: function focus() {
      (0, _nullthrows.default)(this._nativeRef.current).focus();
    }
  }, {
    key: "measure",
    value: function measure(callback) {
      (0, _nullthrows.default)(this._nativeRef.current).measure(callback);
    }
  }, {
    key: "measureInWindow",
    value: function measureInWindow(callback) {
      (0, _nullthrows.default)(this._nativeRef.current).measureInWindow(callback);
    }
  }, {
    key: "measureLayout",
    value: function measureLayout(relativeToNativeNode, onSuccess, onFail) {
      (0, _nullthrows.default)(this._nativeRef.current).measureLayout(relativeToNativeNode, onSuccess, onFail);
    }
  }, {
    key: "setNativeProps",
    value: function setNativeProps(nativeProps) {
      (0, _nullthrows.default)(this._nativeRef.current).setNativeProps(nativeProps);
    }
  }], [{
    key: "positions",
    get: function get() {
      console.warn('Setting DrawerLayoutAndroid drawerPosition using `DrawerLayoutAndroid.positions` is deprecated. Instead pass the string value "left" or "right"');
      return {
        Left: 'left',
        Right: 'right'
      };
    }
  }]);
  return DrawerLayoutAndroid;
}(React.Component);
var styles = _StyleSheet.default.create({
  base: {
    flex: 1,
    elevation: 16
  },
  mainSubview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  drawerSubview: {
    position: 'absolute',
    top: 0,
    bottom: 0
  },
  statusBar: {
    height: _StatusBar.default.currentHeight
  },
  drawerStatusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: _StatusBar.default.currentHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.251)'
  }
});
module.exports = DrawerLayoutAndroid;