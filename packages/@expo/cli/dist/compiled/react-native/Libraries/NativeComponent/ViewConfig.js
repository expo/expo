var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createViewConfig = createViewConfig;
var _PlatformBaseViewConfig = _interopRequireDefault(require("./PlatformBaseViewConfig"));
function createViewConfig(partialViewConfig) {
  return {
    uiViewClassName: partialViewConfig.uiViewClassName,
    Commands: {},
    bubblingEventTypes: composeIndexers(_PlatformBaseViewConfig.default.bubblingEventTypes, partialViewConfig.bubblingEventTypes),
    directEventTypes: composeIndexers(_PlatformBaseViewConfig.default.directEventTypes, partialViewConfig.directEventTypes),
    validAttributes: composeIndexers(_PlatformBaseViewConfig.default.validAttributes, partialViewConfig.validAttributes)
  };
}
function composeIndexers(maybeA, maybeB) {
  var _ref;
  return maybeA == null || maybeB == null ? (_ref = maybeA != null ? maybeA : maybeB) != null ? _ref : {} : Object.assign({}, maybeA, maybeB);
}