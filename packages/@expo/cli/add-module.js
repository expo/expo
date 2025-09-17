// A wrapper that allows to import an ESM module from a CJS module.
// This works because the `import` in this wrapper is not transpiled by SWC.
module.exports = function (name) {
  return import(name);
};
