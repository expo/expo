"use strict";

exports.__esModule = true;
exports.mergeConfig = mergeConfig;
function _Errors() {
  const data = require("./Errors");
  _Errors = function () {
    return data;
  };
  return data;
}
function isMergeable(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const tag = Object.prototype.toString.call(value);
  return tag !== '[object Date]' && tag !== '[object RegExp]' && value.$$typeof !== Symbol.for('react.element');
}
function getEnumerableKeys(value) {
  // NOTE(@kitten): Exclude __proto__ from both inputs so assignments cannot change the result's prototype.
  return [...Object.keys(value).filter(key => key !== '__proto__'), ...Object.getOwnPropertySymbols(value).filter(key => Object.prototype.propertyIsEnumerable.call(value, key))];
}
function mergeConfig(target, source, arrayMerge) {
  // NOTE(@kitten): Track active clones only; shared objects in separate branches are valid.
  const ancestors = new WeakSet();
  function clone(value) {
    if (!isMergeable(value)) {
      return value;
    }
    if (ancestors.has(value)) {
      throw new (_Errors().ConfigError)('Cannot merge the Expo config because it contains a circular reference. Remove circular references from the config and its modifications.', 'INVALID_CONFIG');
    }
    ancestors.add(value);
    try {
      return merge(Array.isArray(value) ? [] : Object.create(null), value);
    } finally {
      ancestors.delete(value);
    }
  }
  function merge(target, source) {
    if (Array.isArray(target) !== Array.isArray(source)) {
      return clone(source);
    }
    if (Array.isArray(source)) {
      return arrayMerge ? arrayMerge(target, source) : target.concat(source).map(clone);
    }
    const result = {};
    if (isMergeable(target)) {
      for (const key of getEnumerableKeys(target)) {
        result[key] = clone(target[key]);
      }
    }
    for (const key of getEnumerableKeys(source)) {
      // NOTE(@kitten): Treat inherited target values as absent so own data keys are not dropped or merged into prototypes.
      const hasOwnValue = target != null && Object.hasOwn(target, key) && Object.prototype.propertyIsEnumerable.call(target, key);
      result[key] = hasOwnValue && isMergeable(source[key]) ? merge(target[key], source[key]) : clone(source[key]);
    }
    return result;
  }
  return merge(target, source);
}
//# sourceMappingURL=mergeConfig.js.map