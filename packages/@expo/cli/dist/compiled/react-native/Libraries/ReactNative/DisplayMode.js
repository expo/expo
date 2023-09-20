Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.coerceDisplayMode = coerceDisplayMode;
exports.default = void 0;
var DisplayMode = Object.freeze({
  VISIBLE: 1,
  SUSPENDED: 2,
  HIDDEN: 3
});
function coerceDisplayMode(value) {
  switch (value) {
    case DisplayMode.SUSPENDED:
      return DisplayMode.SUSPENDED;
    case DisplayMode.HIDDEN:
      return DisplayMode.HIDDEN;
    default:
      return DisplayMode.VISIBLE;
  }
}
var _default = DisplayMode;
exports.default = _default;
//# sourceMappingURL=DisplayMode.js.map