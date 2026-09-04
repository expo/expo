// A compiled ES module, as every transpiled Expo config plugin looks
function withPlugin(config) {
  return { ...config, pluginRan: true };
}
exports.__esModule = true;
exports.default = withPlugin;
