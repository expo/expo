'use strict';
function inspect(value) {
  try {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.stack || String(value);
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
function format(f, ...args) {
  if (typeof f !== 'string') return [f, ...args].map(inspect).join(' ');
  let i = 0;
  let out = f.replace(/%[sdifjoO%]/g, (m) => {
    if (m === '%%') return '%';
    if (i >= args.length) return m;
    const a = args[i++];
    switch (m) {
      case '%s': return String(a);
      case '%d': case '%i': return String(parseInt(a, 10));
      case '%f': return String(parseFloat(a));
      case '%j': try { return JSON.stringify(a); } catch { return '[Circular]'; }
      default: return inspect(a);
    }
  });
  for (; i < args.length; i++) out += ' ' + inspect(args[i]);
  return out;
}
module.exports = {
  format,
  inspect,
  inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
    }
  },
  deprecate: (fn) => fn,
  debuglog: () => () => {},
  promisify(fn) {
    return (...args) => new Promise((res, rej) => fn(...args, (err, val) => (err ? rej(err) : res(val))));
  },
  callbackify(fn) {
    return (...args) => {
      const cb = args.pop();
      fn(...args).then((v) => cb(null, v), (e) => cb(e));
    };
  },
  types: {
    isNativeError: (e) => e instanceof Error,
    isDate: (v) => v instanceof Date,
    isRegExp: (v) => v instanceof RegExp,
    isPromise: (v) => v instanceof Promise,
    isProxy: () => false,
  },
  isDeepStrictEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  TextEncoder: globalThis.TextEncoder,
  TextDecoder: globalThis.TextDecoder,
};
