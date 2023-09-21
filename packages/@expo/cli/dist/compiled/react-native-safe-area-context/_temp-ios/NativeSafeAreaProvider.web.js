Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NativeSafeAreaProvider = NativeSafeAreaProvider;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var CSSTransitions = {
  WebkitTransition: 'webkitTransitionEnd',
  Transition: 'transitionEnd',
  MozTransition: 'transitionend',
  MSTransition: 'msTransitionEnd',
  OTransition: 'oTransitionEnd'
};
function NativeSafeAreaProvider(_ref) {
  var children = _ref.children,
    style = _ref.style,
    onInsetsChange = _ref.onInsetsChange;
  React.useEffect(function () {
    if (typeof document === 'undefined') {
      return;
    }
    var element = createContextElement();
    document.body.appendChild(element);
    var onEnd = function onEnd() {
      var _window$getComputedSt = window.getComputedStyle(element),
        paddingTop = _window$getComputedSt.paddingTop,
        paddingBottom = _window$getComputedSt.paddingBottom,
        paddingLeft = _window$getComputedSt.paddingLeft,
        paddingRight = _window$getComputedSt.paddingRight;
      var insets = {
        top: paddingTop ? parseInt(paddingTop, 10) : 0,
        bottom: paddingBottom ? parseInt(paddingBottom, 10) : 0,
        left: paddingLeft ? parseInt(paddingLeft, 10) : 0,
        right: paddingRight ? parseInt(paddingRight, 10) : 0
      };
      var frame = {
        x: 0,
        y: 0,
        width: document.documentElement.offsetWidth,
        height: document.documentElement.offsetHeight
      };
      onInsetsChange({
        nativeEvent: {
          insets: insets,
          frame: frame
        }
      });
    };
    element.addEventListener(getSupportedTransitionEvent(), onEnd);
    onEnd();
    return function () {
      document.body.removeChild(element);
      element.removeEventListener(getSupportedTransitionEvent(), onEnd);
    };
  }, [onInsetsChange]);
  return React.createElement(_reactNative.View, {
    style: style
  }, children);
}
var _supportedTransitionEvent = null;
function getSupportedTransitionEvent() {
  if (_supportedTransitionEvent != null) {
    return _supportedTransitionEvent;
  }
  var element = document.createElement('invalidtype');
  _supportedTransitionEvent = CSSTransitions.Transition;
  for (var key in CSSTransitions) {
    if (element.style[key] !== undefined) {
      _supportedTransitionEvent = CSSTransitions[key];
      break;
    }
  }
  return _supportedTransitionEvent;
}
var _supportedEnv = null;
function getSupportedEnv() {
  if (_supportedEnv !== null) {
    return _supportedEnv;
  }
  var _window = window,
    CSS = _window.CSS;
  if (CSS && CSS.supports && CSS.supports('top: constant(safe-area-inset-top)')) {
    _supportedEnv = 'constant';
  } else {
    _supportedEnv = 'env';
  }
  return _supportedEnv;
}
function getInset(side) {
  return `${getSupportedEnv()}(safe-area-inset-${side})`;
}
function createContextElement() {
  var element = document.createElement('div');
  var style = element.style;
  style.position = 'fixed';
  style.left = '0';
  style.top = '0';
  style.width = '0';
  style.height = '0';
  style.zIndex = '-1';
  style.overflow = 'hidden';
  style.visibility = 'hidden';
  style.transitionDuration = '0.05s';
  style.transitionProperty = 'padding';
  style.transitionDelay = '0s';
  style.paddingTop = getInset('top');
  style.paddingBottom = getInset('bottom');
  style.paddingLeft = getInset('left');
  style.paddingRight = getInset('right');
  return element;
}