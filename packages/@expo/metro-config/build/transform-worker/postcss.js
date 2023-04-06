"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
const CONFIG_FILE_NAME = 'postcss.config';
const debug = require('debug')('expo:metro:transformer:postcss');
function requireUncachedPostcssFile(moduleId) {
  try {
    delete require.cache[require.resolve(moduleId)];
  } catch {}
  try {
    return require(moduleId);
  } catch (error) {
    if (error instanceof Error) {
      error.message = `Cannot load postcss config file ${moduleId}: ${error.message}`;
    }
    throw error;
  }
}
function resolvePostcssConfig(projectRoot) {
  // TODO: Maybe support platform-specific postcss config files in the future.
  const jsConfigPath = _path().default.join(projectRoot, CONFIG_FILE_NAME + '.js');
  if (_fs().default.existsSync(jsConfigPath)) {
    debug('load file:', jsConfigPath);
    return requireUncachedPostcssFile(jsConfigPath);
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
async function transformPostCssModule(props) {
  const inputConfig = resolvePostcssConfig(props.options.projectRoot);
  if (!inputConfig) {
    return props;
  }
  props.src = await processWithPostcssInputConfigAsync(props.options.projectRoot, {
    inputConfig,
    src: props.src,
    filename: props.filename
  });
  return props;
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
  const postcss = await Promise.resolve().then(() => _interopRequireWildcard(require('postcss')));
  const processor = postcss.default(plugins);
  const results = await processor.process(src, processOptions);
  return results.content;
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
      processOptions.parser = await tryRequireThenImport(parser);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Loading PostCSS "${parser}" parser failed: ${error.message}\n\n(@${file})`);
      }
      throw error;
    }
  }
  if (typeof stringifier === 'string') {
    try {
      processOptions.stringifier = await tryRequireThenImport(stringifier);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Loading PostCSS "${stringifier}" stringifier failed: ${error.message}\n\n(@${file})`);
      }
      throw error;
    }
  }
  if (typeof syntax === 'string') {
    try {
      processOptions.syntax = await tryRequireThenImport(syntax);
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
async function tryRequireThenImport(moduleId) {
  try {
    return require(moduleId);
  } catch (requireError) {
    let importESM;
    try {
      // eslint-disable-next-line no-new-func
      importESM = new Function('id', 'return import(id);');
    } catch {
      importESM = null;
    }
    if ((requireError === null || requireError === void 0 ? void 0 : requireError.code) === 'ERR_REQUIRE_ESM' && importESM) {
      return (await importESM(moduleId)).default;
    }
    throw requireError;
  }
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
//# sourceMappingURL=postcss.js.map