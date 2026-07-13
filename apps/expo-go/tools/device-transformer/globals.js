'use strict';
// Runtime globals for running the Metro transform pipeline in a bare JS engine
// (JavaScriptCore shell). Must be the FIRST module evaluated in the bundle.
(function () {
  const g = globalThis;

  // ---------- console / print ----------
  if (typeof g.console === 'undefined') {
    const p = typeof g.print === 'function' ? g.print : function () {};
    const log = (...args) => p(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
    g.console = {
      log, info: log, warn: log, error: log, debug: log, trace: log,
      group: log, groupEnd: () => {}, dir: log, assert: () => {}, time: () => {}, timeEnd: () => {},
    };
  }

  // ---------- microtask/timer shims ----------
  if (typeof g.queueMicrotask !== 'function') {
    g.queueMicrotask = (fn) => Promise.resolve().then(fn);
  }
  if (typeof g.setTimeout !== 'function') {
    let nextId = 1;
    const cancelled = new Set();
    g.setTimeout = function (fn, _delay, ...args) {
      const id = nextId++;
      g.queueMicrotask(() => { if (!cancelled.has(id)) fn(...args); cancelled.delete(id); });
      return id;
    };
    g.clearTimeout = (id) => { cancelled.add(id); };
    g.setInterval = () => { throw new Error('setInterval is not available in the Hermes runtime'); };
    g.clearInterval = () => {};
    g.setImmediate = (fn, ...args) => g.setTimeout(fn, 0, ...args);
    g.clearImmediate = g.clearTimeout;
  }
  if (typeof g.performance === 'undefined') {
    g.performance = { now: () => Date.now() };
  }
  g.global = g;
  // CJS scope vars referenced by a few modules (e.g. babel-preset-expo's
  // resolveModule passes __dirname into a `paths` array our resolve shim
  // ignores). Bundled code has no per-module value, so provide inert globals.
  if (typeof g.__dirname === 'undefined') g.__dirname = '/';
  if (typeof g.__filename === 'undefined') g.__filename = '/index.js';

  // ---------- UTF-8 helpers ----------
  function utf8Encode(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.codePointAt(i);
      if (c >= 0xd800 && c <= 0xdfff) {
        // unpaired surrogate -> U+FFFD like Node
        out.push(0xef, 0xbf, 0xbd);
        continue;
      }
      if (c > 0xffff) i++;
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return Uint8Array.from(out);
  }
  function utf8Decode(bytes, start, end) {
    start = start == null ? 0 : start;
    end = end == null ? bytes.length : end;
    let out = '';
    let i = start;
    while (i < end) {
      const b = bytes[i];
      let cp, extra;
      if (b < 0x80) { cp = b; extra = 0; }
      else if ((b & 0xe0) === 0xc0) { cp = b & 0x1f; extra = 1; }
      else if ((b & 0xf0) === 0xe0) { cp = b & 0x0f; extra = 2; }
      else if ((b & 0xf8) === 0xf0) { cp = b & 0x07; extra = 3; }
      else { out += '�'; i++; continue; }
      if (i + extra >= end + 1) { out += '�'; i++; continue; }
      let valid = true;
      for (let j = 1; j <= extra; j++) {
        const nb = bytes[i + j];
        if (nb === undefined || (nb & 0xc0) !== 0x80) { valid = false; break; }
        cp = (cp << 6) | (nb & 63);
      }
      if (!valid) { out += '�'; i++; continue; }
      i += extra + 1;
      if (cp > 0xffff) {
        cp -= 0x10000;
        out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
      } else {
        out += String.fromCharCode(cp);
      }
    }
    return out;
  }
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function base64Encode(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
      out += B64[b0 >> 2];
      out += B64[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
      out += b1 === undefined ? '=' : B64[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
      out += b2 === undefined ? '=' : B64[b2 & 63];
    }
    return out;
  }
  function base64Decode(str) {
    str = str.replace(/[^A-Za-z0-9+/]/g, '');
    const out = [];
    for (let i = 0; i < str.length; i += 4) {
      const n = (B64.indexOf(str[i]) << 18) | (B64.indexOf(str[i + 1]) << 12) |
        ((B64.indexOf(str[i + 2]) & 63) << 6) | (B64.indexOf(str[i + 3]) & 63);
      out.push((n >> 16) & 255);
      if (str[i + 2] !== undefined) out.push((n >> 8) & 255);
      if (str[i + 3] !== undefined) out.push(n & 255);
    }
    return Uint8Array.from(out);
  }

  if (typeof g.TextEncoder === 'undefined') {
    g.TextEncoder = class TextEncoder {
      encode(str) { return utf8Encode(String(str)); }
    };
  }
  if (typeof g.TextDecoder === 'undefined') {
    g.TextDecoder = class TextDecoder {
      decode(bytes) { return utf8Decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)); }
    };
  }

  // ---------- Buffer (minimal) ----------
  if (typeof g.Buffer === 'undefined') {
    class Buffer extends Uint8Array {
      static from(value, encodingOrOffset, length) {
        if (typeof value === 'string') {
          const enc = (encodingOrOffset || 'utf8').toLowerCase();
          if (enc === 'utf8' || enc === 'utf-8') return new Buffer(utf8Encode(value).buffer);
          if (enc === 'hex') {
            const out = new Buffer(value.length >> 1);
            for (let i = 0; i < out.length; i++) out[i] = parseInt(value.substr(i * 2, 2), 16);
            return out;
          }
          if (enc === 'base64') return new Buffer(base64Decode(value).buffer);
          if (enc === 'latin1' || enc === 'binary' || enc === 'ascii') {
            const out = new Buffer(value.length);
            for (let i = 0; i < value.length; i++) out[i] = value.charCodeAt(i) & 255;
            return out;
          }
          throw new Error('Buffer.from: unsupported encoding ' + enc);
        }
        if (value instanceof ArrayBuffer) return new Buffer(value.slice(0));
        if (ArrayBuffer.isView(value)) {
          return new Buffer(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
        }
        if (Array.isArray(value)) return new Buffer(Uint8Array.from(value).buffer);
        throw new Error('Buffer.from: unsupported value');
      }
      static alloc(size) { return new Buffer(size); }
      static allocUnsafe(size) { return new Buffer(size); }
      static isBuffer(v) { return v instanceof Buffer; }
      static byteLength(str, enc) {
        if (typeof str !== 'string') return str.byteLength;
        return Buffer.from(str, enc || 'utf8').length;
      }
      static concat(list, totalLength) {
        const total = totalLength != null ? totalLength : list.reduce((n, b) => n + b.length, 0);
        const out = new Buffer(total);
        let off = 0;
        for (const b of list) { out.set(b.subarray(0, Math.min(b.length, total - off)), off); off += b.length; if (off >= total) break; }
        return out;
      }
      toString(enc, start, end) {
        enc = (enc || 'utf8').toLowerCase();
        start = start == null ? 0 : start;
        end = end == null ? this.length : end;
        if (enc === 'utf8' || enc === 'utf-8') return utf8Decode(this, start, end);
        if (enc === 'hex') {
          let out = '';
          for (let i = start; i < end; i++) out += this[i].toString(16).padStart(2, '0');
          return out;
        }
        if (enc === 'base64') return base64Encode(this.subarray(start, end));
        if (enc === 'latin1' || enc === 'binary' || enc === 'ascii') {
          let out = '';
          for (let i = start; i < end; i++) out += String.fromCharCode(enc === 'ascii' ? this[i] & 127 : this[i]);
          return out;
        }
        throw new Error('Buffer.toString: unsupported encoding ' + enc);
      }
      slice(start, end) {
        const sub = this.subarray(start, end);
        return new Buffer(sub.buffer.slice(sub.byteOffset, sub.byteOffset + sub.byteLength));
      }
      equals(other) {
        if (this.length !== other.length) return false;
        for (let i = 0; i < this.length; i++) if (this[i] !== other[i]) return false;
        return true;
      }
      write() { throw new Error('Buffer.write not supported in Hermes runtime'); }
    }
    g.Buffer = Buffer;
  }

  // ---------- process ----------
  if (typeof g.process === 'undefined') {
    const noop = () => {};
    const proc = {
      env: {},
      argv: ['jsc', 'device-transformer'],
      execArgv: [],
      platform: 'darwin',
      arch: 'arm64',
      version: 'v22.14.0',
      versions: { node: '22.14.0', v8: '12.4' },
      pid: 1,
      title: 'jsc',
      browser: false,
      exitCode: 0,
      cwd: () => '/project',
      chdir: () => { throw new Error('process.chdir not supported'); },
      nextTick: (fn, ...args) => g.queueMicrotask(() => fn(...args)),
      exit: (code) => { throw new Error('process.exit(' + code + ') called in Hermes runtime'); },
      hrtime: Object.assign((prev) => {
        const ms = Date.now();
        const s = Math.floor(ms / 1000), ns = (ms % 1000) * 1e6;
        if (prev) { let ds = s - prev[0], dns = ns - prev[1]; if (dns < 0) { ds--; dns += 1e9; } return [ds, dns]; }
        return [s, ns];
      }, { bigint: () => BigInt(Date.now()) * 1000000n }),
      memoryUsage: () => ({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0 }),
      emitWarning: noop,
      on: function () { return this; },
      once: function () { return this; },
      off: function () { return this; },
      removeListener: function () { return this; },
      listeners: () => [],
      binding: () => { throw new Error('process.binding not supported'); },
      stdout: { write: (s) => { g.console.log(String(s).replace(/\n$/, '')); return true; }, isTTY: false },
      stderr: { write: (s) => { g.console.log(String(s).replace(/\n$/, '')); return true; }, isTTY: false },
      stdin: { isTTY: false },
      umask: () => 0,
      uptime: () => 0,
      getuid: () => 501,
      allowedNodeEnvironmentFlags: new Set(),
      features: {},
      config: {},
      release: { name: 'node' },
    };
    g.process = proc;
  }

  // ---------- dynamic require fallback ----------
  // esbuild's __require helper defers to a global `require` when it exists.
  // The pipeline performs a handful of dynamic requires / require.resolves
  // that we pre-register from the entrypoint.
  g.__jscRegistry = g.__jscRegistry || {};
  g.__jscResolveMap = g.__jscResolveMap || {};
  if (typeof g.require === 'undefined') {
    const globalRequire = function require(id) {
      const reg = g.__jscRegistry;
      if (Object.prototype.hasOwnProperty.call(reg, id)) return reg[id]();
      const e = new Error("Cannot find module '" + id + "' (unregistered dynamic require in Hermes runtime)");
      e.code = 'MODULE_NOT_FOUND';
      throw e;
    };
    globalRequire.resolve = function resolve(id) {
      const map = g.__jscResolveMap;
      if (Object.prototype.hasOwnProperty.call(map, id)) {
        const v = map[id];
        if (v && typeof v === 'object' && v.throwCode) {
          const e = new Error("Cannot find module '" + id + "'");
          e.code = v.throwCode;
          throw e;
        }
        return v;
      }
      const e = new Error("Cannot find module '" + id + "' (unregistered require.resolve in Hermes runtime)");
      e.code = 'MODULE_NOT_FOUND';
      throw e;
    };
    globalRequire.cache = {};
    g.require = globalRequire;
  }

  // ---------- generic node builtin stub factory ----------
  g.__nodeBuiltinStub = function (name) {
    const stub = new Proxy({ __esModule: true }, {
      get(t, key) {
        // `__esModule: true` makes __importStar/__toESM helpers pass the proxy
        // through instead of copying (empty) own keys.
        if (key === '__esModule') return true;
        if (typeof key === 'symbol') return undefined;
        if (key === 'default') return stub;
        return function () {
          throw new Error("node builtin '" + name + "." + String(key) + "' is not available in the Hermes runtime");
        };
      },
    });
    return stub;
  };
})();
