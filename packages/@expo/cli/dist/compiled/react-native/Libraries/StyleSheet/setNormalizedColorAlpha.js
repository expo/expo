'use strict';
function setNormalizedColorAlpha(input, alpha) {
  if (alpha < 0) {
    alpha = 0;
  } else if (alpha > 1) {
    alpha = 1;
  }
  alpha = Math.round(alpha * 255);
  return (input & 0xffffff00 | alpha) >>> 0;
}
module.exports = setNormalizedColorAlpha;
//# sourceMappingURL=setNormalizedColorAlpha.js.map