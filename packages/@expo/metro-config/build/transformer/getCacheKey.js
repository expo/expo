"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheKey = exports.cacheKeyParts = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = require("fs");
exports.cacheKeyParts = [
    (0, fs_1.readFileSync)(__filename),
    // Since babel-preset-fbjs cannot be safely resolved relative to the
    // project root, use this environment variable that we define earlier.
    process.env.EXPO_METRO_CACHE_KEY_VERSION || '3.3.0',
    //   require('babel-preset-fbjs/package.json').version,
];
// Matches upstream
function getCacheKey() {
    const key = crypto_1.default.createHash('md5');
    exports.cacheKeyParts.forEach((part) => key.update(part));
    return key.digest('hex');
}
exports.getCacheKey = getCacheKey;
//# sourceMappingURL=getCacheKey.js.map