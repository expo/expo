var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _NativeEventEmitter = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _ModalInjection = _interopRequireDefault(require("./ModalInjection"));
var _NativeModalManager = _interopRequireDefault(require("./NativeModalManager"));
var _RCTModalHostViewNativeComponent = _interopRequireDefault(require("./RCTModalHostViewNativeComponent"));
var _virtualizedLists = require("@react-native/virtualized-lists");
var _jsxRuntime = require("react/jsx-runtime");
var _container, _ModalInjection$unsta;
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ScrollView = require('../Components/ScrollView/ScrollView');
var View = require('../Components/View/View');
var AppContainer = require('../ReactNative/AppContainer');
var I18nManager = require('../ReactNative/I18nManager');
var _require = require('../ReactNative/RootTag'),
  RootTagContext = _require.RootTagContext;
var StyleSheet = require('../StyleSheet/StyleSheet');
var Platform = require('../Utilities/Platform');
var React = require('react');
var ModalEventEmitter = Platform.OS === 'ios' && _NativeModalManager.default != null ? new _NativeEventEmitter.default(Platform.OS !== 'ios' ? null : _NativeModalManager.default) : null;
var uniqueModalIdentifier = 0;
function confirmProps(props) {
  if (__DEV__) {
    if (props.presentationStyle && props.presentationStyle !== 'overFullScreen' && props.transparent === true) {
      console.warn(`Modal with '${props.presentationStyle}' presentation style and 'transparent' value is not supported.`);
    }
  }
}
var Modal = function (_React$Component) {
  (0, _inherits2.default)(Modal, _React$Component);
  var _super = _createSuper(Modal);
  function Modal(props) {
    var _this;
    (0, _classCallCheck2.default)(this, Modal);
    _this = _super.call(this, props);
    if (__DEV__) {
      confirmProps(props);
    }
    _this._identifier = uniqueModalIdentifier++;
    return _this;
  }
  (0, _createClass2.default)(Modal, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      if (ModalEventEmitter) {
        this._eventSubscription = ModalEventEmitter.addListener('modalDismissed', function (event) {
          if (event.modalID === _this2._identifier && _this2.props.onDismiss) {
            _this2.props.onDismiss();
          }
        });
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this._eventSubscription) {
        this._eventSubscription.remove();
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      if (__DEV__) {
        confirmProps(this.props);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;
      if (this.props.visible !== true) {
        return null;
      }
      var containerStyles = {
        backgroundColor: this.props.transparent === true ? 'transparent' : 'white'
      };
      var animationType = this.props.animationType || 'none';
      var presentationStyle = this.props.presentationStyle;
      if (!presentationStyle) {
        presentationStyle = 'fullScreen';
        if (this.props.transparent === true) {
          presentationStyle = 'overFullScreen';
        }
      }
      var innerChildren = __DEV__ ? (0, _jsxRuntime.jsx)(AppContainer, {
        rootTag: this.context,
        children: this.props.children
      }) : this.props.children;
      return (0, _jsxRuntime.jsx)(_RCTModalHostViewNativeComponent.default, {
        animationType: animationType,
        presentationStyle: presentationStyle,
        transparent: this.props.transparent,
        hardwareAccelerated: this.props.hardwareAccelerated,
        onRequestClose: this.props.onRequestClose,
        onShow: this.props.onShow,
        onDismiss: function onDismiss() {
          if (_this3.props.onDismiss) {
            _this3.props.onDismiss();
          }
        },
        visible: this.props.visible,
        statusBarTranslucent: this.props.statusBarTranslucent,
        identifier: this._identifier,
        style: styles.modal,
        onStartShouldSetResponder: this._shouldSetResponder,
        supportedOrientations: this.props.supportedOrientations,
        onOrientationChange: this.props.onOrientationChange,
        testID: this.props.testID,
        children: (0, _jsxRuntime.jsx)(_virtualizedLists.VirtualizedListContextResetter, {
          children: (0, _jsxRuntime.jsx)(ScrollView.Context.Provider, {
            value: null,
            children: (0, _jsxRuntime.jsx)(View, {
              style: [styles.container, containerStyles],
              collapsable: false,
              children: innerChildren
            })
          })
        })
      });
    }
  }, {
    key: "_shouldSetResponder",
    value: function _shouldSetResponder() {
      return true;
    }
  }]);
  return Modal;
}(React.Component);
Modal.defaultProps = {
  visible: true,
  hardwareAccelerated: false
};
Modal.contextType = RootTagContext;
var side = I18nManager.getConstants().isRTL ? 'right' : 'left';
var styles = StyleSheet.create({
  modal: {
    position: 'absolute'
  },
  container: (_container = {}, (0, _defineProperty2.default)(_container, side, 0), (0, _defineProperty2.default)(_container, "top", 0), (0, _defineProperty2.default)(_container, "flex", 1), _container)
});
var ExportedModal = (_ModalInjection$unsta = _ModalInjection.default.unstable_Modal) != null ? _ModalInjection$unsta : Modal;
module.exports = ExportedModal;