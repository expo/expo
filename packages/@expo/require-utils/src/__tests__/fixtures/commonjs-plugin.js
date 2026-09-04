// A hand-written CommonJS module, without an `__esModule` marker
module.exports = function withPlugin(config) {
  return { ...config, pluginRan: true };
};
