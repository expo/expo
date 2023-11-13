"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cacheKeyParts = void 0;
exports.getCacheKey = getCacheKey;
function _crypto() {
  const data = _interopRequireDefault(require("crypto"));
  _crypto = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = require("fs");
  _fs = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const cacheKeyParts = [(0, _fs().readFileSync)(__filename),
// Since babel-preset-fbjs cannot be safely resolved relative to the
// project root, use this environment variable that we define earlier.
process.env.EXPO_METRO_CACHE_KEY_VERSION || '3.3.0'
//   require('babel-preset-fbjs/package.json').version,
];

// Matches upstream
exports.cacheKeyParts = cacheKeyParts;
function getCacheKey() {
  const key = _crypto().default.createHash('md5');
  cacheKeyParts.forEach(part => key.update(part));
  return key.digest('hex');
}
//# sourceMappingURL=getCacheKey.js.map