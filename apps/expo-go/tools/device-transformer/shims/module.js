'use strict';
function createRequire() {
  const req = function (id) {
    if (globalThis.require) return globalThis.require(id);
    const e = new Error("Cannot find module '" + id + "' (createRequire in Hermes runtime)");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
  };
  req.resolve = function (id, opts) {
    if (globalThis.require && globalThis.require.resolve) return globalThis.require.resolve(id, opts);
    const e = new Error("Cannot find module '" + id + "' (createRequire.resolve in Hermes runtime)");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
  };
  req.cache = {};
  return req;
}
const Module = {
  createRequire,
  builtinModules: ['fs', 'path', 'assert', 'os', 'util', 'url', 'module', 'crypto', 'events', 'tty', 'buffer', 'process'],
  _cache: {},
  _resolveFilename(id) {
    const e = new Error("Cannot find module '" + id + "' (Module._resolveFilename in Hermes runtime)");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
  },
};
Module.Module = Module;
module.exports = Module;
