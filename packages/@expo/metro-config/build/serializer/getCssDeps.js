"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fileNameFromContents = fileNameFromContents;
exports.filterJsModules = filterJsModules;
exports.getCssSerialAssets = getCssSerialAssets;
exports.getFileName = getFileName;
function _js() {
  const data = require("metro/src/DeltaBundler/Serializers/helpers/js");
  _js = function () {
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
function _css() {
  const data = require("../transform-worker/css");
  _css = function () {
    return data;
  };
  return data;
}
function _hash() {
  const data = require("../utils/hash");
  _hash = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// s = static
const STATIC_EXPORT_DIRECTORY = '_expo/static/css';
function filterJsModules(dependencies, type, {
  processModuleFilter,
  projectRoot
}) {
  const assets = [];
  for (const module of dependencies.values()) {
    if ((0, _js().isJsModule)(module) && processModuleFilter(module) && (0, _js().getJsOutput)(module).type === type && _path().default.relative(projectRoot, module.path) !== 'package.json') {
      assets.push(module);
    }
  }
  return assets;
}
function getCssSerialAssets(dependencies, {
  processModuleFilter,
  projectRoot
}) {
  const assets = [];
  for (const module of filterJsModules(dependencies, 'js/module', {
    processModuleFilter,
    projectRoot
  })) {
    const cssMetadata = getCssMetadata(module);
    if (cssMetadata) {
      const contents = cssMetadata.code;
      const originFilename = _path().default.relative(projectRoot, module.path);
      const filename = _path().default.join(
      // Consistent location
      STATIC_EXPORT_DIRECTORY,
      // Hashed file contents + name for caching
      fileNameFromContents({
        // Stable filename for hashing in CI.
        filepath: originFilename,
        src: contents
      }) + '.css');
      assets.push({
        type: 'css',
        originFilename,
        filename,
        source: contents,
        metadata: {
          hmrId: (0, _css().pathToHtmlSafeName)(originFilename)
        }
      });
    }
  }
  return assets;
}
function getCssMetadata(module) {
  var _module$output$;
  const data = (_module$output$ = module.output[0]) === null || _module$output$ === void 0 ? void 0 : _module$output$.data;
  if (data && typeof data === 'object' && 'css' in data) {
    if (typeof data.css !== 'object' || !('code' in data.css)) {
      throw new Error(`Unexpected CSS metadata in Metro module (${module.path}): ${JSON.stringify(data.css)}`);
    }
    return data.css;
  }
  return null;
}
function fileNameFromContents({
  filepath,
  src
}) {
  // Decode if the path is encoded from the Metro dev server, then normalize paths for Windows support.
  const decoded = decodeURIComponent(filepath).replace(/\\/g, '/');
  return getFileName(decoded) + '-' + (0, _hash().hashString)(src);
}
function getFileName(module) {
  return _path().default.basename(module).replace(/\.[^.]+$/, '');
}
//# sourceMappingURL=getCssDeps.js.map