'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = queueMicrotask;
var resolvedPromise;
function queueMicrotask(callback) {
  if (arguments.length < 1) {
    throw new TypeError('queueMicrotask must be called with at least one argument (a function to call)');
  }
  if (typeof callback !== 'function') {
    throw new TypeError('The argument to queueMicrotask must be a function.');
  }
  (resolvedPromise || (resolvedPromise = Promise.resolve())).then(callback).catch(function (error) {
    return setTimeout(function () {
      throw error;
    }, 0);
  });
}
//# sourceMappingURL=queueMicrotask.js.map