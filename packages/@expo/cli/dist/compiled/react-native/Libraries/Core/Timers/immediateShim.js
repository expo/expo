'use strict';
var GUIID = 1;
var clearedImmediates = new Set();
function setImmediate(callback) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  if (arguments.length < 1) {
    throw new TypeError('setImmediate must be called with at least one argument (a function to call)');
  }
  if (typeof callback !== 'function') {
    throw new TypeError('The first argument to setImmediate must be a function.');
  }
  var id = GUIID++;
  if (clearedImmediates.has(id)) {
    clearedImmediates.delete(id);
  }
  global.queueMicrotask(function () {
    if (!clearedImmediates.has(id)) {
      callback.apply(undefined, args);
    } else {
      clearedImmediates.delete(id);
    }
  });
  return id;
}
function clearImmediate(immediateID) {
  clearedImmediates.add(immediateID);
}
var immediateShim = {
  setImmediate: setImmediate,
  clearImmediate: clearImmediate
};
module.exports = immediateShim;