Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSquare = createSquare;
exports.normalizeRect = normalizeRect;
function createSquare(size) {
  return {
    bottom: size,
    left: size,
    right: size,
    top: size
  };
}
function normalizeRect(rectOrSize) {
  return typeof rectOrSize === 'number' ? createSquare(rectOrSize) : rectOrSize;
}
//# sourceMappingURL=Rect.js.map