"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hashString = hashString;
function _crypto() {
  const data = _interopRequireDefault(require("crypto"));
  _crypto = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function hashString(str) {
  return _crypto().default.createHash('md5').update(str).digest('hex');
}
//# sourceMappingURL=hash.js.map