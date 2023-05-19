"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withTailwind = withTailwind;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _build() {
  const data = require("tailwindcss/lib/cli/build");
  _build = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function withTailwind(config, cssPathname = './global.css', {
  input = _path().default.relative(process.cwd(), cssPathname),
  output = _path().default.resolve(process.cwd(), 'node_modules/.cache/expo/', cssPathname)
} = {}) {
  const getTransformOptions = async (entryPoints, options, getDependenciesOf) => {
    var _config$transformer, _config$transformer$g;
    process.stdout.clearLine(0);
    await (0, _build().build)({
      '--input': input,
      '--output': output,
      '--watch': options.dev ? 'always' : false,
      '--poll': true
    });
    return (_config$transformer = config.transformer) === null || _config$transformer === void 0 ? void 0 : (_config$transformer$g = _config$transformer.getTransformOptions) === null || _config$transformer$g === void 0 ? void 0 : _config$transformer$g.call(_config$transformer, entryPoints, options, getDependenciesOf);
  };
  return {
    ...config,
    resolver: {
      ...config.resolver,
      sourceExts: Array.from(new Set([...config.resolver.sourceExts, _path().default.extname(cssPathname)]))
    },
    transformerPath: require.resolve('@expo/metro-config/transformer'),
    transformer: {
      ...config.transformer,
      getTransformOptions,
      cssInterop: true,
      externallyManagedCss: {
        ...config.transformer.externallyManagedCss,
        [input]: output
      }
    }
  };
}
//# sourceMappingURL=withTailwind.js.map