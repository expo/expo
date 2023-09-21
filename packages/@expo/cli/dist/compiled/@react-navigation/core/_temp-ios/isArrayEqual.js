Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isArrayEqual;
function isArrayEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every(function (it, index) {
    return it === b[index];
  });
}