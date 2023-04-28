"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fileNameFromContents = fileNameFromContents;
exports.getCssModules = getCssModules;
exports.getFileName = getFileName;
exports.hashString = hashString;
function _crypto() {
  const data = _interopRequireDefault(require("crypto"));
  _crypto = function () {
    return data;
  };
  return data;
}
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
  const data = require("./transform-worker/css");
  _css = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getCssModules(dependencies, {
  processModuleFilter,
  projectRoot
}) {
  const assets = [];
  for (const module of dependencies.values()) {
    if ((0, _js().isJsModule)(module) && processModuleFilter(module) && (0, _js().getJsOutput)(module).type === 'js/module' && _path().default.relative(projectRoot, module.path) !== 'package.json') {
      const cssMetadata = getCssMetadata(module);
      if (cssMetadata) {
        const contents = cssMetadata.code;
        const filename = _path().default.join(
        // Consistent location
        STATIC_EXPORT_DIRECTORY,
        // Hashed file contents + name for caching
        fileNameFromContents({
          filepath: module.path,
          src: contents
        }) + '.css');
        const originFilename = _path().default.relative(projectRoot, module.path);
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

// s = static
const STATIC_EXPORT_DIRECTORY = '_expo/static/css';
function fileNameFromContents({
  filepath,
  src
}) {
  return getFileName(filepath) + '-' + hashString(filepath + src);
}
function getFileName(module) {
  return _path().default.basename(module).replace(/\.[^.]+$/, '');
}
function hashString(str) {
  return _crypto().default.createHash('md5').update(str).digest('hex');
}
//# sourceMappingURL=getCssDeps.js.map