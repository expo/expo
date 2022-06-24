"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;

/** `lodash.get` */
function get(obj, key) {
  const branches = key.split('.');
  let current = obj;
  let branch;

  while (branch = branches.shift()) {
    if (!(branch in current)) {
      return undefined;
    }

    current = current[branch];
  }

  return current;
}
//# sourceMappingURL=obj.js.map