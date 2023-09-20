'use strict';

var logListeners;
function unstable_setLogListeners(listeners) {
  logListeners = listeners;
}
var deepDiffer = function deepDiffer(one, two) {
  var maxDepthOrOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
  var maybeOptions = arguments.length > 3 ? arguments[3] : undefined;
  var options = typeof maxDepthOrOptions === 'number' ? maybeOptions : maxDepthOrOptions;
  var maxDepth = typeof maxDepthOrOptions === 'number' ? maxDepthOrOptions : -1;
  if (maxDepth === 0) {
    return true;
  }
  if (one === two) {
    return false;
  }
  if (typeof one === 'function' && typeof two === 'function') {
    var unsafelyIgnoreFunctions = options == null ? void 0 : options.unsafelyIgnoreFunctions;
    if (unsafelyIgnoreFunctions == null) {
      if (logListeners && logListeners.onDifferentFunctionsIgnored && (!options || !('unsafelyIgnoreFunctions' in options))) {
        logListeners.onDifferentFunctionsIgnored(one.name, two.name);
      }
      unsafelyIgnoreFunctions = true;
    }
    return !unsafelyIgnoreFunctions;
  }
  if (typeof one !== 'object' || one === null) {
    return one !== two;
  }
  if (typeof two !== 'object' || two === null) {
    return true;
  }
  if (one.constructor !== two.constructor) {
    return true;
  }
  if (Array.isArray(one)) {
    var len = one.length;
    if (two.length !== len) {
      return true;
    }
    for (var ii = 0; ii < len; ii++) {
      if (deepDiffer(one[ii], two[ii], maxDepth - 1, options)) {
        return true;
      }
    }
  } else {
    for (var key in one) {
      if (deepDiffer(one[key], two[key], maxDepth - 1, options)) {
        return true;
      }
    }
    for (var twoKey in two) {
      if (one[twoKey] === undefined && two[twoKey] !== undefined) {
        return true;
      }
    }
  }
  return false;
};
deepDiffer.unstable_setLogListeners = unstable_setLogListeners;
module.exports = deepDiffer;
//# sourceMappingURL=deepDiffer.js.map