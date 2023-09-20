var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.__INTERNAL_VIEW_CONFIG = exports.Commands = void 0;
var NativeComponentRegistry = _interopRequireWildcard(require("../../NativeComponent/NativeComponentRegistry"));
var _codegenNativeCommands = _interopRequireDefault(require("../../Utilities/codegenNativeCommands"));
var _RCTTextInputViewConfig = _interopRequireDefault(require("./RCTTextInputViewConfig"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var Commands = (0, _codegenNativeCommands.default)({
  supportedCommands: ['focus', 'blur', 'setTextAndSelection']
});
exports.Commands = Commands;
var __INTERNAL_VIEW_CONFIG = Object.assign({
  uiViewClassName: 'RCTSinglelineTextInputView'
}, _RCTTextInputViewConfig.default);
exports.__INTERNAL_VIEW_CONFIG = __INTERNAL_VIEW_CONFIG;
var SinglelineTextInputNativeComponent = NativeComponentRegistry.get('RCTSinglelineTextInputView', function () {
  return __INTERNAL_VIEW_CONFIG;
});
var _default = SinglelineTextInputNativeComponent;
exports.default = _default;
//# sourceMappingURL=RCTSingelineTextInputNativeComponent.js.map