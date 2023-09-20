Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processColorObject = exports.normalizeColorObject = exports.PlatformColor = void 0;
var PlatformColor = function PlatformColor() {
  for (var _len = arguments.length, names = new Array(_len), _key = 0; _key < _len; _key++) {
    names[_key] = arguments[_key];
  }
  return {
    resource_paths: names
  };
};
exports.PlatformColor = PlatformColor;
var normalizeColorObject = function normalizeColorObject(color) {
  if ('resource_paths' in color) {
    return color;
  }
  return null;
};
exports.normalizeColorObject = normalizeColorObject;
var processColorObject = function processColorObject(color) {
  return color;
};
exports.processColorObject = processColorObject;
//# sourceMappingURL=PlatformColorValueTypes.android.js.map