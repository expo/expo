'use strict';

var warnedKeys = {};
function warnOnce(key, message) {
  if (warnedKeys[key]) {
    return;
  }
  console.warn(message);
  warnedKeys[key] = true;
}
module.exports = warnOnce;