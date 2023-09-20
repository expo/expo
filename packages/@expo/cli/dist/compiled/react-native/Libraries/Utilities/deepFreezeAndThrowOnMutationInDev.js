'use strict';
function deepFreezeAndThrowOnMutationInDev(object) {
  if (__DEV__) {
    if (typeof object !== 'object' || object === null || Object.isFrozen(object) || Object.isSealed(object)) {
      return object;
    }
    var keys = Object.keys(object);
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (_hasOwnProperty.call(object, key)) {
        Object.defineProperty(object, key, {
          get: identity.bind(null, object[key])
        });
        Object.defineProperty(object, key, {
          set: throwOnImmutableMutation.bind(null, key)
        });
      }
    }
    Object.freeze(object);
    Object.seal(object);
    for (var _i = 0; _i < keys.length; _i++) {
      var _key = keys[_i];
      if (_hasOwnProperty.call(object, _key)) {
        deepFreezeAndThrowOnMutationInDev(object[_key]);
      }
    }
  }
  return object;
}
function throwOnImmutableMutation(key, value) {
  throw Error('You attempted to set the key `' + key + '` with the value `' + JSON.stringify(value) + '` on an object that is meant to be immutable ' + 'and has been frozen.');
}
function identity(value) {
  return value;
}
module.exports = deepFreezeAndThrowOnMutationInDev;
//# sourceMappingURL=deepFreezeAndThrowOnMutationInDev.js.map