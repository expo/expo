var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _View = _interopRequireDefault(require("../Components/View/View"));
var _RCTDeviceEventEmitter = _interopRequireDefault(require("../EventEmitter/RCTDeviceEventEmitter"));
var _StyleSheet = _interopRequireDefault(require("../StyleSheet/StyleSheet"));
var _RootTag = require("./RootTag");
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var reactDevToolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
var AppContainer = function (_React$Component) {
  (0, _inherits2.default)(AppContainer, _React$Component);
  var _super = _createSuper(AppContainer);
  function AppContainer() {
    var _this;
    (0, _classCallCheck2.default)(this, AppContainer);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.state = {
      inspector: null,
      devtoolsOverlay: null,
      traceUpdateOverlay: null,
      mainKey: 1,
      hasError: false
    };
    _this._subscription = null;
    _this._reactDevToolsAgentListener = null;
    return _this;
  }
  (0, _createClass2.default)(AppContainer, [{
    key: "mountReactDevToolsOverlays",
    value: function mountReactDevToolsOverlays() {
      var DevtoolsOverlay = require('../Inspector/DevtoolsOverlay').default;
      var devtoolsOverlay = (0, _jsxRuntime.jsx)(DevtoolsOverlay, {
        inspectedView: this._mainRef
      });
      var TraceUpdateOverlay = require('../Components/TraceUpdateOverlay/TraceUpdateOverlay').default;
      var traceUpdateOverlay = (0, _jsxRuntime.jsx)(TraceUpdateOverlay, {});
      this.setState({
        devtoolsOverlay: devtoolsOverlay,
        traceUpdateOverlay: traceUpdateOverlay
      });
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      if (__DEV__) {
        if (!this.props.internal_excludeInspector) {
          this._subscription = _RCTDeviceEventEmitter.default.addListener('toggleElementInspector', function () {
            var Inspector = require('../Inspector/Inspector');
            var inspector = _this2.state.inspector ? null : (0, _jsxRuntime.jsx)(Inspector, {
              inspectedView: _this2._mainRef,
              onRequestRerenderApp: function onRequestRerenderApp(updateInspectedView) {
                _this2.setState(function (s) {
                  return {
                    mainKey: s.mainKey + 1
                  };
                }, function () {
                  return updateInspectedView(_this2._mainRef);
                });
              }
            });
            _this2.setState({
              inspector: inspector
            });
          });
          if (reactDevToolsHook != null) {
            if (reactDevToolsHook.reactDevtoolsAgent) {
              this.mountReactDevToolsOverlays();
              return;
            }
            this._reactDevToolsAgentListener = function () {
              return _this2.mountReactDevToolsOverlays();
            };
            reactDevToolsHook.on('react-devtools', this._reactDevToolsAgentListener);
          }
        }
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this._subscription != null) {
        this._subscription.remove();
      }
      if (reactDevToolsHook != null && this._reactDevToolsAgentListener != null) {
        reactDevToolsHook.off('react-devtools', this._reactDevToolsAgentListener);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;
      var logBox = null;
      if (__DEV__) {
        if (!this.props.internal_excludeLogBox) {
          var LogBoxNotificationContainer = require('../LogBox/LogBoxNotificationContainer').default;
          logBox = (0, _jsxRuntime.jsx)(LogBoxNotificationContainer, {});
        }
      }
      var innerView = (0, _jsxRuntime.jsx)(_View.default, {
        collapsable: !this.state.inspector && !this.state.devtoolsOverlay,
        pointerEvents: "box-none",
        style: styles.appContainer,
        ref: function ref(_ref) {
          _this3._mainRef = _ref;
        },
        children: this.props.children
      }, this.state.mainKey);
      var Wrapper = this.props.WrapperComponent;
      if (Wrapper != null) {
        innerView = (0, _jsxRuntime.jsx)(Wrapper, {
          initialProps: this.props.initialProps,
          fabric: this.props.fabric === true,
          showArchitectureIndicator: this.props.showArchitectureIndicator === true,
          children: innerView
        });
      }
      return (0, _jsxRuntime.jsx)(_RootTag.RootTagContext.Provider, {
        value: (0, _RootTag.createRootTag)(this.props.rootTag),
        children: (0, _jsxRuntime.jsxs)(_View.default, {
          style: styles.appContainer,
          pointerEvents: "box-none",
          children: [!this.state.hasError && innerView, this.state.traceUpdateOverlay, this.state.devtoolsOverlay, this.state.inspector, logBox]
        })
      });
    }
  }]);
  return AppContainer;
}(React.Component);
AppContainer.getDerivedStateFromError = undefined;
var styles = _StyleSheet.default.create({
  appContainer: {
    flex: 1
  }
});
module.exports = AppContainer;