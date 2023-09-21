var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _sha = _interopRequireDefault(require("./lib/sha1"));
var _v = _interopRequireDefault(require("./lib/v35"));
var _globalThis$expo;
var nativeUuidv4 = globalThis == null ? void 0 : (_globalThis$expo = globalThis.expo) == null ? void 0 : _globalThis$expo.uuidv4;
function uuidv4() {
  if (!nativeUuidv4) {
    throw Error("Native UUID version 4 generator implementation wasn't found in `expo-modules-core`");
  }
  return nativeUuidv4();
}
var uuid = {
  v4: uuidv4,
  v5: (0, _v.default)('v5', 0x50, _sha.default)
};
var _default = uuid;
exports.default = _default;