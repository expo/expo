"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transform = transform;
function _metroTransformWorker() {
  const data = _interopRequireDefault(require("metro-transform-worker"));
  _metroTransformWorker = function () {
    return data;
  };
  return data;
}
function _css() {
  const data = require("./css");
  _css = function () {
    return data;
  };
  return data;
}
function _cssModules() {
  const data = require("./css-modules");
  _cssModules = function () {
    return data;
  };
  return data;
}
function _postcss() {
  const data = require("./postcss");
  _postcss = function () {
    return data;
  };
  return data;
}
function _sass() {
  const data = require("./sass");
  _sass = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
const countLines = require('metro/src/lib/countLines');
async function transform(config, projectRoot, filename, data, options) {
  var _jsModuleResults$outp2;
  const isCss = options.type !== 'asset' && /\.(s?css|sass)$/.test(filename);
  // If the file is not CSS, then use the default behavior.
  if (!isCss) {
    var _options$customTransf;
    const environment = (_options$customTransf = options.customTransformOptions) === null || _options$customTransf === void 0 ? void 0 : _options$customTransf.environment;
    if (environment === 'client' &&
    // TODO: Ensure this works with windows.
    // TODO: Add +api files.
    filename.match(new RegExp(`^app/\\+html(\\.${options.platform})?\\.([tj]sx?|[cm]js)?$`))) {
      // Remove the server-only +html file from the bundle when bundling for a client environment.
      return _metroTransformWorker().default.transform(config, projectRoot, filename, !options.minify ? Buffer.from(
      // Use a string so this notice is visible in the bundle if the user is
      // looking for it.
      '"> The server-only +html file was removed from the client JS bundle by Expo CLI."') : Buffer.from(''), options);
    }
    return _metroTransformWorker().default.transform(config, projectRoot, filename, data, options);
  }

  // If the platform is not web, then return an empty module.
  if (options.platform !== 'web') {
    const code = (0, _cssModules().matchCssModule)(filename) ? 'module.exports={};' : '';
    return _metroTransformWorker().default.transform(config, projectRoot, filename,
    // TODO: Native CSS Modules
    Buffer.from(code), options);
  }
  let code = data.toString('utf8');

  // Apply postcss transforms
  code = await (0, _postcss().transformPostCssModule)(projectRoot, {
    src: code,
    filename
  });

  // TODO: When native has CSS support, this will need to move higher up.
  const syntax = (0, _sass().matchSass)(filename);
  if (syntax) {
    code = (0, _sass().compileSass)(projectRoot, {
      filename,
      src: code
    }, {
      syntax
    }).src;
  }

  // If the file is a CSS Module, then transform it to a JS module
  // in development and a static CSS file in production.
  if ((0, _cssModules().matchCssModule)(filename)) {
    var _jsModuleResults$outp;
    const results = await (0, _cssModules().transformCssModuleWeb)({
      filename,
      src: code,
      options: {
        projectRoot,
        dev: options.dev,
        minify: options.minify,
        sourceMap: false
      }
    });
    const jsModuleResults = await _metroTransformWorker().default.transform(config, projectRoot, filename, Buffer.from(results.output), options);
    const cssCode = results.css.toString();
    const output = [{
      type: 'js/module',
      data: {
        // @ts-expect-error
        ...((_jsModuleResults$outp = jsModuleResults.output[0]) === null || _jsModuleResults$outp === void 0 ? void 0 : _jsModuleResults$outp.data),
        // Append additional css metadata for static extraction.
        css: {
          code: cssCode,
          lineCount: countLines(cssCode),
          map: [],
          functionMap: null
        }
      }
    }];
    return {
      dependencies: jsModuleResults.dependencies,
      output
    };
  }

  // Global CSS:

  const {
    transform
  } = await Promise.resolve().then(() => _interopRequireWildcard(require('lightningcss')));

  // TODO: Add bundling to resolve imports
  // https://lightningcss.dev/bundling.html#bundling-order

  const cssResults = transform({
    filename,
    code: Buffer.from(code),
    sourceMap: false,
    cssModules: false,
    projectRoot,
    minify: options.minify
  });

  // TODO: Warnings:
  // cssResults.warnings.forEach((warning) => {
  // });

  // Create a mock JS module that exports an empty object,
  // this ensures Metro dependency graph is correct.
  const jsModuleResults = await _metroTransformWorker().default.transform(config, projectRoot, filename, options.dev ? Buffer.from((0, _css().wrapDevelopmentCSS)({
    src: code,
    filename
  })) : Buffer.from(''), options);
  const cssCode = cssResults.code.toString();

  // In production, we export the CSS as a string and use a special type to prevent
  // it from being included in the JS bundle. We'll extract the CSS like an asset later
  // and append it to the HTML bundle.
  const output = [{
    type: 'js/module',
    data: {
      // @ts-expect-error
      ...((_jsModuleResults$outp2 = jsModuleResults.output[0]) === null || _jsModuleResults$outp2 === void 0 ? void 0 : _jsModuleResults$outp2.data),
      // Append additional css metadata for static extraction.
      css: {
        code: cssCode,
        lineCount: countLines(cssCode),
        map: [],
        functionMap: null
      }
    }
  }];
  return {
    dependencies: jsModuleResults.dependencies,
    output
  };
}

/**
 * A custom Metro transformer that adds support for processing Expo-specific bundler features.
 * - Global CSS files on web.
 * - CSS Modules on web.
 * - TODO: Tailwind CSS on web.
 */
module.exports = {
  // Use defaults for everything that's not custom.
  ..._metroTransformWorker().default,
  transform
};
//# sourceMappingURL=transform-worker.js.map