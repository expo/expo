var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.__INTERNAL_VIEW_CONFIG = exports.Commands = void 0;
var NativeComponentRegistry = _interopRequireWildcard(require("../../NativeComponent/NativeComponentRegistry"));
var _codegenNativeCommands = _interopRequireDefault(require("../../Utilities/codegenNativeCommands"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var __INTERNAL_VIEW_CONFIG = _Platform.default.OS === 'android' ? {
  uiViewClassName: 'RCTView',
  validAttributes: {
    removeClippedSubviews: true,
    accessible: true,
    hasTVPreferredFocus: true,
    nextFocusDown: true,
    nextFocusForward: true,
    nextFocusLeft: true,
    nextFocusRight: true,
    nextFocusUp: true,
    borderRadius: true,
    borderTopLeftRadius: true,
    borderTopRightRadius: true,
    borderBottomRightRadius: true,
    borderBottomLeftRadius: true,
    borderTopStartRadius: true,
    borderTopEndRadius: true,
    borderBottomStartRadius: true,
    borderBottomEndRadius: true,
    borderEndEndRadius: true,
    borderEndStartRadius: true,
    borderStartEndRadius: true,
    borderStartStartRadius: true,
    borderStyle: true,
    hitSlop: true,
    pointerEvents: true,
    nativeBackgroundAndroid: true,
    nativeForegroundAndroid: true,
    needsOffscreenAlphaCompositing: true,
    borderWidth: true,
    borderLeftWidth: true,
    borderRightWidth: true,
    borderTopWidth: true,
    borderBottomWidth: true,
    borderStartWidth: true,
    borderEndWidth: true,
    borderColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderLeftColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderRightColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderTopColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderBottomColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderStartColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderEndColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderBlockColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderBlockEndColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderBlockStartColor: {
      process: require('../../StyleSheet/processColor').default
    },
    focusable: true,
    overflow: true,
    backfaceVisibility: true
  }
} : {
  uiViewClassName: 'RCTView'
};
exports.__INTERNAL_VIEW_CONFIG = __INTERNAL_VIEW_CONFIG;
var ViewNativeComponent = NativeComponentRegistry.get('RCTView', function () {
  return __INTERNAL_VIEW_CONFIG;
});
var Commands = (0, _codegenNativeCommands.default)({
  supportedCommands: ['hotspotUpdate', 'setPressed']
});
exports.Commands = Commands;
var _default = ViewNativeComponent;
exports.default = _default;
//# sourceMappingURL=ViewNativeComponent.js.map