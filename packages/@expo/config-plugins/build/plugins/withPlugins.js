"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withPlugins = void 0;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function _withStaticPlugin() {
  const data = require("./withStaticPlugin");
  _withStaticPlugin = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Resolves a list of plugins.
 *
 * @param config exported config
 * @param plugins list of config plugins to apply to the exported config
 */
const withPlugins = (config, plugins) => {
  (0, _assert().default)(Array.isArray(plugins), 'withPlugins expected a valid array of plugins or plugin module paths');
  return plugins.reduce((prev, plugin) => (0, _withStaticPlugin().withStaticPlugin)(prev, {
    plugin
  }), config);
};
exports.withPlugins = withPlugins;
//# sourceMappingURL=withPlugins.js.map