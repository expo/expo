"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPostcssConfigHash = getPostcssConfigHash;
exports.pluginFactory = pluginFactory;
exports.resolvePostcssConfig = resolvePostcssConfig;
exports.transformPostCssModule = transformPostCssModule;
function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));
  _jsonFile = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _require() {
  const data = require("./utils/require");
  _require = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright © 2023 650 Industries.
 * Copyright JS Foundation and other contributors
 *
 * https://github.com/webpack-contrib/postcss-loader/
 */

const CONFIG_FILE_NAME = 'postcss.config';
const debug = require('debug')('expo:metro:transformer:postcss');
async function transformPostCssModule(projectRoot, {
  src,
  filename
}) {
  const inputConfig = resolvePostcssConfig(projectRoot);
  if (!inputConfig) {
    return {
      src,
      hasPostcss: false
    };
  }
  return {
    src: await processWithPostcssInputConfigAsync(projectRoot, {
      inputConfig,
      src,
      filename
    }),
    hasPostcss: true
  };
}
async function processWithPostcssInputConfigAsync(projectRoot, {
  src,
  filename,
  inputConfig
}) {
  const {
    plugins,
    processOptions
  } = await parsePostcssConfigAsync(projectRoot, {
    config: inputConfig,
    resourcePath: filename
  });
  debug('options:', processOptions);
  debug('plugins:', plugins);

  // TODO: Surely this can be cached...
  const postcss = require('postcss');
  const processor = postcss.default(plugins);
  const {
    content
  } = await processor.process(src, processOptions);
  return content;
}
async function parsePostcssConfigAsync(projectRoot, {
  resourcePath: file,
  config: {
    plugins: inputPlugins,
    map,
    parser,
    stringifier,
    syntax,
    ...config
  } = {}
}) {
  const factory = pluginFactory();
  factory(inputPlugins);
  // delete config.plugins;

  const plugins = [...factory()].map(item => {
    const [plugin, options] = item;
    if (typeof plugin === 'string') {
      return loadPlugin(projectRoot, plugin, options, file);
    }
    return plugin;
  });
  if (config.from) {
    config.from = _path().default.resolve(projectRoot, config.from);
  }
  if (config.to) {
    config.to = _path().default.resolve(projectRoot, config.to);
  }
  const processOptions = {
    from: file,
    to: file,
    map: false
  };
  if (typeof parser === 'string') {
    try {
      var _resolveFrom$silent;
      processOptions.parser = await (0, _require().tryRequireThenImport)((_resolveFrom$silent = _resolveFrom().default.silent(projectRoot, parser)) !== null && _resolveFrom$silent !== void 0 ? _resolveFrom$silent : parser);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Loading PostCSS "${parser}" parser failed: ${error.message}\n\n(@${file})`);
      }
      throw error;
    }
  }
  if (typeof stringifier === 'string') {
    try {
      var _resolveFrom$silent2;
      processOptions.stringifier = await (0, _require().tryRequireThenImport)((_resolveFrom$silent2 = _resolveFrom().default.silent(projectRoot, stringifier)) !== null && _resolveFrom$silent2 !== void 0 ? _resolveFrom$silent2 : stringifier);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Loading PostCSS "${stringifier}" stringifier failed: ${error.message}\n\n(@${file})`);
      }
      throw error;
    }
  }
  if (typeof syntax === 'string') {
    try {
      var _resolveFrom$silent3;
      processOptions.syntax = await (0, _require().tryRequireThenImport)((_resolveFrom$silent3 = _resolveFrom().default.silent(projectRoot, syntax)) !== null && _resolveFrom$silent3 !== void 0 ? _resolveFrom$silent3 : syntax);
    } catch (error) {
      throw new Error(`Loading PostCSS "${syntax}" syntax failed: ${error.message}\n\n(@${file})`);
    }
  }
  if (map === true) {
    // https://github.com/postcss/postcss/blob/master/docs/source-maps.md
    processOptions.map = {
      inline: true
    };
  }
  return {
    plugins,
    processOptions
  };
}
function loadPlugin(projectRoot, plugin, options, file) {
  try {
    debug('load plugin:', plugin);

    // e.g. `tailwindcss`
    let loadedPlugin = require((0, _resolveFrom().default)(projectRoot, plugin));
    if (loadedPlugin.default) {
      loadedPlugin = loadedPlugin.default;
    }
    if (!options || !Object.keys(options).length) {
      return loadedPlugin;
    }
    return loadedPlugin(options);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Loading PostCSS "${plugin}" plugin failed: ${error.message}\n\n(@${file})`);
    }
    throw error;
  }
}
function pluginFactory() {
  const listOfPlugins = new Map();
  return plugins => {
    if (typeof plugins === 'undefined') {
      return listOfPlugins;
    }
    if (Array.isArray(plugins)) {
      for (const plugin of plugins) {
        if (Array.isArray(plugin)) {
          const [name, options] = plugin;
          if (typeof name !== 'string') {
            throw new Error(`PostCSS plugin must be a string, but "${name}" was found. Please check your configuration.`);
          }
          listOfPlugins.set(name, options);
        } else if (plugin && typeof plugin === 'function') {
          listOfPlugins.set(plugin, undefined);
        } else if (plugin && Object.keys(plugin).length === 1 && (typeof plugin[Object.keys(plugin)[0]] === 'object' || typeof plugin[Object.keys(plugin)[0]] === 'boolean') && plugin[Object.keys(plugin)[0]] !== null) {
          const [name] = Object.keys(plugin);
          const options = plugin[name];
          if (options === false) {
            listOfPlugins.delete(name);
          } else {
            listOfPlugins.set(name, options);
          }
        } else if (plugin) {
          listOfPlugins.set(plugin, undefined);
        }
      }
    } else {
      const objectPlugins = Object.entries(plugins);
      for (const [name, options] of objectPlugins) {
        if (options === false) {
          listOfPlugins.delete(name);
        } else {
          listOfPlugins.set(name, options);
        }
      }
    }
    return listOfPlugins;
  };
}
function resolvePostcssConfig(projectRoot) {
  // TODO: Maybe support platform-specific postcss config files in the future.
  const jsConfigPath = _path().default.join(projectRoot, CONFIG_FILE_NAME + '.js');
  if (_fs().default.existsSync(jsConfigPath)) {
    debug('load file:', jsConfigPath);
    return (0, _require().requireUncachedFile)(jsConfigPath);
  }
  const jsonConfigPath = _path().default.join(projectRoot, CONFIG_FILE_NAME + '.json');
  if (_fs().default.existsSync(jsonConfigPath)) {
    debug('load file:', jsonConfigPath);
    return _jsonFile().default.read(jsonConfigPath, {
      json5: true
    });
  }
  return null;
}
function getPostcssConfigHash(projectRoot) {
  // TODO: Maybe recurse plugins and add versions to the hash in the future.
  const {
    stableHash
  } = require('metro-cache');
  const jsConfigPath = _path().default.join(projectRoot, CONFIG_FILE_NAME + '.js');
  if (_fs().default.existsSync(jsConfigPath)) {
    return stableHash(_fs().default.readFileSync(jsConfigPath, 'utf8')).toString('hex');
  }
  const jsonConfigPath = _path().default.join(projectRoot, CONFIG_FILE_NAME + '.json');
  if (_fs().default.existsSync(jsonConfigPath)) {
    return stableHash(_fs().default.readFileSync(jsonConfigPath, 'utf8')).toString('hex');
  }
  return null;
}
//# sourceMappingURL=postcss.js.map