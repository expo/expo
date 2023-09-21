'use strict';

function processFontVariant(fontVariant) {
  if (Array.isArray(fontVariant)) {
    return fontVariant;
  }
  var match = fontVariant.split(' ').filter(Boolean);
  return match;
}
module.exports = processFontVariant;