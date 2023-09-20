var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.getWithFallback_DEPRECATED = getWithFallback_DEPRECATED;
exports.setRuntimeConfigProvider = setRuntimeConfigProvider;
exports.unstable_hasStaticViewConfig = unstable_hasStaticViewConfig;
var _getNativeComponentAttributes = _interopRequireDefault(require("../ReactNative/getNativeComponentAttributes"));
var _UIManager = _interopRequireDefault(require("../ReactNative/UIManager"));
var _ReactNativeViewConfigRegistry = _interopRequireDefault(require("../Renderer/shims/ReactNativeViewConfigRegistry"));
var _verifyComponentAttributeEquivalence = _interopRequireDefault(require("../Utilities/verifyComponentAttributeEquivalence"));
var StaticViewConfigValidator = _interopRequireWildcard(require("./StaticViewConfigValidator"));
var _ViewConfig = require("./ViewConfig");
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var getRuntimeConfig;
function setRuntimeConfigProvider(runtimeConfigProvider) {
  (0, _invariant.default)(getRuntimeConfig == null, 'NativeComponentRegistry.setRuntimeConfigProvider() called more than once.');
  getRuntimeConfig = runtimeConfigProvider;
}
function get(name, viewConfigProvider) {
  _ReactNativeViewConfigRegistry.default.register(name, function () {
    var _getRuntimeConfig;
    var _ref = (_getRuntimeConfig = getRuntimeConfig == null ? void 0 : getRuntimeConfig(name)) != null ? _getRuntimeConfig : {
        native: true,
        strict: false,
        verify: false
      },
      native = _ref.native,
      strict = _ref.strict,
      verify = _ref.verify;
    var viewConfig = native ? (0, _getNativeComponentAttributes.default)(name) : (0, _ViewConfig.createViewConfig)(viewConfigProvider());
    if (verify) {
      var nativeViewConfig = native ? viewConfig : (0, _getNativeComponentAttributes.default)(name);
      var staticViewConfig = native ? (0, _ViewConfig.createViewConfig)(viewConfigProvider()) : viewConfig;
      if (strict) {
        var validationOutput = StaticViewConfigValidator.validate(name, nativeViewConfig, staticViewConfig);
        if (validationOutput.type === 'invalid') {
          console.error(StaticViewConfigValidator.stringifyValidationResult(name, validationOutput));
        }
      } else {
        (0, _verifyComponentAttributeEquivalence.default)(nativeViewConfig, staticViewConfig);
      }
    }
    return viewConfig;
  });
  return name;
}
function getWithFallback_DEPRECATED(name, viewConfigProvider) {
  if (getRuntimeConfig == null) {
    if (hasNativeViewConfig(name)) {
      return get(name, viewConfigProvider);
    }
  } else {
    if (getRuntimeConfig(name) != null) {
      return get(name, viewConfigProvider);
    }
  }
  var FallbackNativeComponent = function FallbackNativeComponent(props) {
    return null;
  };
  FallbackNativeComponent.displayName = `Fallback(${name})`;
  return FallbackNativeComponent;
}
function hasNativeViewConfig(name) {
  (0, _invariant.default)(getRuntimeConfig == null, 'Unexpected invocation!');
  return _UIManager.default.getViewManagerConfig(name) != null;
}
function unstable_hasStaticViewConfig(name) {
  var _getRuntimeConfig2;
  var _ref2 = (_getRuntimeConfig2 = getRuntimeConfig == null ? void 0 : getRuntimeConfig(name)) != null ? _getRuntimeConfig2 : {
      native: true
    },
    native = _ref2.native;
  return !native;
}
//# sourceMappingURL=NativeComponentRegistry.js.map