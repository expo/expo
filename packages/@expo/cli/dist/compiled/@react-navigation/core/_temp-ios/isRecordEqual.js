Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isRecordEqual;
function isRecordEqual(a, b) {
  if (a === b) {
    return true;
  }
  var aKeys = Object.keys(a);
  var bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every(function (key) {
    return a[key] === b[key];
  });
}