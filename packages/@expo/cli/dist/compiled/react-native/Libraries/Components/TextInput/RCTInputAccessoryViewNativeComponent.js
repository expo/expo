var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _codegenNativeComponent = _interopRequireDefault(require("../../Utilities/codegenNativeComponent"));
var _default = (0, _codegenNativeComponent.default)('InputAccessory', {
  interfaceOnly: true,
  paperComponentName: 'RCTInputAccessoryView',
  excludedPlatforms: ['android']
});
exports.default = _default;