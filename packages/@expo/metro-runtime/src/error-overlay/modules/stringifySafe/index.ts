/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Tries to stringify with JSON.stringify and toString, but catches exceptions
 * (e.g. from circular objects) and always returns a string and never throws.
 */
export function createStringifySafeWithLimits(limits: {
  maxDepth?: number;
  maxStringLimit?: number;
  maxArrayLimit?: number;
  maxObjectKeysLimit?: number;
}): (foo: any) => string {
  const {
    maxDepth = Number.POSITIVE_INFINITY,
    maxStringLimit = Number.POSITIVE_INFINITY,
    maxArrayLimit = Number.POSITIVE_INFINITY,
    maxObjectKeysLimit = Number.POSITIVE_INFINITY,
  } = limits;
  const stack: any[] = [];
  function replacer(this: unknown, _key: string, value: any): any {
    while (stack.length && this !== stack[0]) {
      stack.shift();
    }

    if (typeof value === 'string') {
      const truncatedString = '...(truncated)...';
      if (value.length > maxStringLimit + truncatedString.length) {
        return value.substring(0, maxStringLimit) + truncatedString;
      }
      return value;
    }
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    let retval = value;
    if (Array.isArray(value)) {
      if (stack.length >= maxDepth) {
        retval = `[ ... array with ${value.length} values ... ]`;
      } else if (value.length > maxArrayLimit) {
        retval = value
          .slice(0, maxArrayLimit)
          .concat([`... extra ${value.length - maxArrayLimit} values truncated ...`]);
      }
    } else {
      // Add refinement after Array.isArray call.
      if (typeof value !== 'object') {
        throw new Error('This was already found earlier');
      }
      const keys = Object.keys(value);
      if (stack.length >= maxDepth) {
        retval = `{ ... object with ${keys.length} keys ... }`;
      } else if (keys.length > maxObjectKeysLimit) {
        // Return a sample of the keys.
        retval = {};
        for (const k of keys.slice(0, maxObjectKeysLimit)) {
          retval[k] = value[k];
        }
        const truncatedKey = '...(truncated keys)...';
        retval[truncatedKey] = keys.length - maxObjectKeysLimit;
      }
    }
    stack.unshift(retval);
    return retval;
  }

  return function stringifySafe(arg: any): string {
    if (arg === undefined) {
      return 'undefined';
    } else if (arg === null) {
      return 'null';
    } else if (typeof arg === 'function') {
      try {
        return arg.toString();
      } catch {
        return '[function unknown]';
      }
    } else if (arg instanceof Error) {
      return arg.name + ': ' + arg.message;
    } else {
      // Perform a try catch, just in case the object has a circular
      // reference or stringify throws for some other reason.
      try {
        const ret = JSON.stringify(arg, replacer);
        if (ret === undefined) {
          return '["' + typeof arg + '" failed to stringify]';
        }
        return ret;
      } catch {
        if (typeof arg.toString === 'function') {
          try {
            // $FlowFixMe[incompatible-use] : toString shouldn't take any arguments in general.
            return arg.toString();
          } catch {}
        }
      }
    }
    return '["' + typeof arg + '" failed to stringify]';
  };
}

const stringifySafe = createStringifySafeWithLimits({
  maxDepth: 10,
  maxStringLimit: 100,
  maxArrayLimit: 50,
  maxObjectKeysLimit: 50,
});

export default stringifySafe;
