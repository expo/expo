exports.__esModule = true;
exports.pluginName = 'test';
exports.default = function withPlugin(config) {
  return { ...config, pluginRan: true };
};
