var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _sha = _interopRequireDefault(require("./lib/sha1"));
var _v = _interopRequireDefault(require("./lib/v35"));
function uuidv4() {
  var cryptoObject = typeof crypto === 'undefined' || typeof crypto.randomUUID === 'undefined' ? require('crypto') : crypto;
  if (!(cryptoObject != null && cryptoObject.randomUUID)) {
    throw Error("The browser doesn't support `crypto.randomUUID` function");
  }
  return cryptoObject.randomUUID();
}
var uuid = {
  v4: uuidv4,
  v5: (0, _v.default)('v5', 0x50, _sha.default)
};
var _default = uuid;
exports.default = _default;