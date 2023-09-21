var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NativeVirtualText = exports.NativeText = void 0;
var _ViewConfig = require("../NativeComponent/ViewConfig");
var _UIManager = _interopRequireDefault(require("../ReactNative/UIManager"));
var _createReactNativeComponentClass = _interopRequireDefault(require("../Renderer/shims/createReactNativeComponentClass"));
var textViewConfig = {
  validAttributes: {
    isHighlighted: true,
    isPressable: true,
    numberOfLines: true,
    ellipsizeMode: true,
    allowFontScaling: true,
    dynamicTypeRamp: true,
    maxFontSizeMultiplier: true,
    disabled: true,
    selectable: true,
    selectionColor: true,
    adjustsFontSizeToFit: true,
    minimumFontScale: true,
    textBreakStrategy: true,
    onTextLayout: true,
    onInlineViewLayout: true,
    dataDetectorType: true,
    android_hyphenationFrequency: true,
    lineBreakStrategyIOS: true
  },
  directEventTypes: {
    topTextLayout: {
      registrationName: 'onTextLayout'
    },
    topInlineViewLayout: {
      registrationName: 'onInlineViewLayout'
    }
  },
  uiViewClassName: 'RCTText'
};
var virtualTextViewConfig = {
  validAttributes: {
    isHighlighted: true,
    isPressable: true,
    maxFontSizeMultiplier: true
  },
  uiViewClassName: 'RCTVirtualText'
};
var NativeText = (0, _createReactNativeComponentClass.default)('RCTText', function () {
  return (0, _ViewConfig.createViewConfig)(textViewConfig);
});
exports.NativeText = NativeText;
var NativeVirtualText = !global.RN$Bridgeless && !_UIManager.default.hasViewManagerConfig('RCTVirtualText') ? NativeText : (0, _createReactNativeComponentClass.default)('RCTVirtualText', function () {
  return (0, _ViewConfig.createViewConfig)(virtualTextViewConfig);
});
exports.NativeVirtualText = NativeVirtualText;