var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUrlCacheBreaker = getUrlCacheBreaker;
exports.pickScale = pickScale;
exports.setUrlCacheBreaker = setUrlCacheBreaker;
var _PixelRatio = _interopRequireDefault(require("../Utilities/PixelRatio"));
var cacheBreaker;
var warnIfCacheBreakerUnset = true;
function pickScale(scales, deviceScale) {
  if (deviceScale == null) {
    deviceScale = _PixelRatio.default.get();
  }
  for (var i = 0; i < scales.length; i++) {
    if (scales[i] >= deviceScale) {
      return scales[i];
    }
  }
  return scales[scales.length - 1] || 1;
}
function setUrlCacheBreaker(appendage) {
  cacheBreaker = appendage;
}
function getUrlCacheBreaker() {
  if (cacheBreaker == null) {
    if (__DEV__ && warnIfCacheBreakerUnset) {
      warnIfCacheBreakerUnset = false;
      console.warn('AssetUtils.getUrlCacheBreaker: Cache breaker value is unset');
    }
    return '';
  }
  return cacheBreaker;
}
//# sourceMappingURL=AssetUtils.js.map