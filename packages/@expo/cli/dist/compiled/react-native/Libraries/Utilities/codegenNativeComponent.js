var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _requireNativeComponent = _interopRequireDefault(require("../../Libraries/ReactNative/requireNativeComponent"));
var _UIManager = _interopRequireDefault(require("../ReactNative/UIManager"));
function codegenNativeComponent(componentName, options) {
  if (global.RN$Bridgeless === true) {
    var errorMessage = "Native Component '" + componentName + "' that calls codegenNativeComponent was not code generated at build time. Please check its definition.";
    console.error(errorMessage);
  }
  var componentNameInUse = options && options.paperComponentName != null ? options.paperComponentName : componentName;
  if (options != null && options.paperComponentNameDeprecated != null) {
    if (_UIManager.default.hasViewManagerConfig(componentName)) {
      componentNameInUse = componentName;
    } else if (options.paperComponentNameDeprecated != null && _UIManager.default.hasViewManagerConfig(options.paperComponentNameDeprecated)) {
      componentNameInUse = options.paperComponentNameDeprecated;
    } else {
      var _options$paperCompone;
      throw new Error(`Failed to find native component for either ${componentName} or ${(_options$paperCompone = options.paperComponentNameDeprecated) != null ? _options$paperCompone : '(unknown)'}`);
    }
  }
  return (0, _requireNativeComponent.default)(componentNameInUse);
}
var _default = codegenNativeComponent;
exports.default = _default;