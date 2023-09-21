var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processFonts = processFonts;
var _ReactNativeStyleAttributes = _interopRequireDefault(require("react-native/Libraries/Components/View/ReactNativeStyleAttributes"));
function processFonts(fontFamilies) {
  var _ReactNativeStyleAttr;
  var fontFamilyProcessor = (_ReactNativeStyleAttr = _ReactNativeStyleAttributes.default.fontFamily) == null ? void 0 : _ReactNativeStyleAttr.process;
  if (typeof fontFamilyProcessor === 'function') {
    return fontFamilies.map(fontFamilyProcessor);
  }
  return fontFamilies;
}