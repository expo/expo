'use strict';
// Stub for the `debug` package: everything disabled, zero side effects.
function createDebug(namespace) {
  const fn = function () {};
  fn.enabled = false;
  fn.namespace = namespace;
  fn.useColors = false;
  fn.color = 0;
  fn.diff = 0;
  fn.log = function () {};
  fn.extend = (suffix, delimiter) => createDebug(namespace + (delimiter === undefined ? ':' : delimiter) + suffix);
  fn.destroy = () => true;
  return fn;
}
createDebug.default = createDebug;
createDebug.debug = createDebug;
createDebug.enable = () => {};
createDebug.disable = () => '';
createDebug.enabled = () => false;
createDebug.coerce = (v) => v;
createDebug.names = [];
createDebug.skips = [];
createDebug.formatters = {};
createDebug.log = function () {};
createDebug.selectColor = () => 0;
createDebug.humanize = (v) => String(v);
module.exports = createDebug;
