"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withPlugins = void 0;
const assert_1 = __importDefault(require("assert"));
const withStaticPlugin_1 = require("./withStaticPlugin");
/**
 * Resolves a list of plugins.
 *
 * @param config exported config
 * @param plugins list of config config plugins to apply to the exported config
 */
const withPlugins = (config, plugins) => {
    (0, assert_1.default)(Array.isArray(plugins), 'withPlugins expected a valid array of plugins or plugin module paths');
    return plugins.reduce((prev, plugin) => (0, withStaticPlugin_1.withStaticPlugin)(prev, { plugin }), config);
};
exports.withPlugins = withPlugins;
