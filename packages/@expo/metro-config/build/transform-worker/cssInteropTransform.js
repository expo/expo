"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cssInteropTransform = cssInteropTransform;
function _cssToRn() {
  const data = require("@expo/styling/css-to-rn");
  _cssToRn = function () {
    return data;
  };
  return data;
}
function _metroTransformWorker() {
  const data = _interopRequireDefault(require("metro-transform-worker"));
  _metroTransformWorker = function () {
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
function _preprocessors() {
  const data = require("./preprocessors");
  _preprocessors = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function cssInteropTransform(config, projectRoot, filename, data, options) {
  const code = await (0, _preprocessors().cssPreprocessors)(projectRoot, filename, data);
  const nativeStyles = (0, _cssToRn().cssToReactNativeRuntime)(Buffer.from(code, 'utf8'));
  if ((0, _cssModules().matchCssModule)(filename)) {
    return _metroTransformWorker().default.transform(config, projectRoot, filename, Buffer.from(`module.exports = require("@expo/styling").StyleSheet.create(${JSON.stringify(nativeStyles)});`), options);
  } else {
    return _metroTransformWorker().default.transform(config, projectRoot, filename, Buffer.from(`require("@expo/styling").StyleSheet.register(${JSON.stringify(nativeStyles)});`), options);
  }
}
//# sourceMappingURL=cssInteropTransform.js.map