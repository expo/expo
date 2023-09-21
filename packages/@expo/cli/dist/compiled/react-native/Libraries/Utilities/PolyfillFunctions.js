'use strict';

var defineLazyObjectProperty = require('./defineLazyObjectProperty');
function polyfillObjectProperty(object, name, getValue) {
  var descriptor = Object.getOwnPropertyDescriptor(object, name);
  if (__DEV__ && descriptor) {
    var backupName = `original${name[0].toUpperCase()}${name.substr(1)}`;
    Object.defineProperty(object, backupName, descriptor);
  }
  var _ref = descriptor || {},
    enumerable = _ref.enumerable,
    writable = _ref.writable,
    _ref$configurable = _ref.configurable,
    configurable = _ref$configurable === void 0 ? false : _ref$configurable;
  if (descriptor && !configurable) {
    console.error('Failed to set polyfill. ' + name + ' is not configurable.');
    return;
  }
  defineLazyObjectProperty(object, name, {
    get: getValue,
    enumerable: enumerable !== false,
    writable: writable !== false
  });
}
function polyfillGlobal(name, getValue) {
  polyfillObjectProperty(global, name, getValue);
}
module.exports = {
  polyfillObjectProperty: polyfillObjectProperty,
  polyfillGlobal: polyfillGlobal
};