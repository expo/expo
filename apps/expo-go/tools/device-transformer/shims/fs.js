'use strict';
// fs stub: no filesystem exists in Hermes. existsSync answers `false` (the
// pipeline only probes for optional config files that don't exist for this
// project: babel configs and browserslist configs); everything else throws
// ENOENT or an explicit unsupported error so unexpected use is loud.
const touches = (globalThis.__fsTouches = globalThis.__fsTouches || []);

function enoent(syscall, path) {
  const e = new Error("ENOENT: no such file or directory, " + syscall + " '" + path + "'");
  e.code = 'ENOENT';
  e.errno = -2;
  e.syscall = syscall;
  e.path = String(path);
  return e;
}
function unsupported(name) {
  return function () {
    throw new Error('fs.' + name + ' is not available in the Hermes runtime');
  };
}

const fs = {
  existsSync(p) { touches.push('existsSync ' + p); return false; },
  statSync(p, opts) {
    touches.push('statSync ' + p);
    if (opts && opts.throwIfNoEntry === false) return undefined;
    throw enoent('stat', p);
  },
  lstatSync(p, opts) {
    touches.push('lstatSync ' + p);
    if (opts && opts.throwIfNoEntry === false) return undefined;
    throw enoent('lstat', p);
  },
  readFileSync(p) { touches.push('readFileSync ' + p); throw enoent('open', p); },
  readdirSync(p) { touches.push('readdirSync ' + p); throw enoent('scandir', p); },
  realpathSync: Object.assign(function realpathSync(p) { touches.push('realpathSync ' + p); return String(p); }, {
    native: function (p) { return String(p); },
  }),
  readFile(p, opts, cb) {
    if (typeof opts === 'function') cb = opts;
    touches.push('readFile ' + p);
    if (cb) cb(enoent('open', p));
  },
  stat(p, opts, cb) {
    if (typeof opts === 'function') cb = opts;
    touches.push('stat ' + p);
    if (cb) cb(enoent('stat', p));
  },
  exists(p, cb) { touches.push('exists ' + p); if (cb) cb(false); },
  writeFileSync: unsupported('writeFileSync'),
  writeFile: unsupported('writeFile'),
  mkdirSync: unsupported('mkdirSync'),
  mkdir: unsupported('mkdir'),
  unlinkSync: unsupported('unlinkSync'),
  rmSync: unsupported('rmSync'),
  openSync: unsupported('openSync'),
  readSync: unsupported('readSync'),
  closeSync: unsupported('closeSync'),
  createReadStream: unsupported('createReadStream'),
  createWriteStream: unsupported('createWriteStream'),
  watch: unsupported('watch'),
  watchFile: unsupported('watchFile'),
  constants: { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 },
  promises: new Proxy({}, {
    get(_t, key) {
      if (key === '__esModule' || typeof key === 'symbol') return undefined;
      return function () {
        return Promise.reject(new Error('fs.promises.' + String(key) + ' is not available in the Hermes runtime'));
      };
    },
  }),
};

module.exports = fs;
