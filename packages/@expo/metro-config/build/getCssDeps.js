"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCssModules = getCssModules;
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getCssModules(dependencies, {
  processModuleFilter,
  projectRoot
}) {
  const promises = [];
  for (const module of dependencies.values()) {
    if ((0, _js().isJsModule)(module) && processModuleFilter(module) && (0, _js().getJsOutput)(module).type === 'js/module' && _path().default.relative(projectRoot, module.path) !== 'package.json') {
      const cssMetadata = getCssMetadata(module);
      if (cssMetadata) {
        const contents = cssMetadata.code;
        promises.push([module.path, contents]);
      }
    }
  }
  return promises;
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
//# sourceMappingURL=getCssDeps.js.map