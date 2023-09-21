var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _sha = _interopRequireDefault(require("./lib/sha1"));
var _v = _interopRequireDefault(require("./lib/v35"));
var _default = (0, _v.default)('v5', 0x50, _sha.default);
exports.default = _default;