"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configureEasBuildAsync = configureEasBuildAsync;
exports.getEasBuildGradlePath = getEasBuildGradlePath;
exports.isEasBuildGradleConfiguredAsync = isEasBuildGradleConfiguredAsync;
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
function _EasBuildGradleScript() {
  const data = _interopRequireDefault(require("./EasBuildGradleScript"));
  _EasBuildGradleScript = function () {
    return data;
  };
  return data;
}
function Paths() {
  const data = _interopRequireWildcard(require("./Paths"));
  Paths = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const APPLY_EAS_GRADLE = 'apply from: "./eas-build.gradle"';
function hasApplyLine(content, applyLine) {
  return content.replace(/\r\n/g, '\n').split('\n')
  // Check for both single and double quotes
  .some(line => line === applyLine || line === applyLine.replace(/"/g, "'"));
}
function getEasBuildGradlePath(projectRoot) {
  return _path().default.join(projectRoot, 'android', 'app', 'eas-build.gradle');
}
async function configureEasBuildAsync(projectRoot) {
  const buildGradlePath = Paths().getAppBuildGradleFilePath(projectRoot);
  const easGradlePath = getEasBuildGradlePath(projectRoot);
  await _fs().default.promises.writeFile(easGradlePath, _EasBuildGradleScript().default);
  const buildGradleContent = await _fs().default.promises.readFile(_path().default.join(buildGradlePath), 'utf8');
  const hasEasGradleApply = hasApplyLine(buildGradleContent, APPLY_EAS_GRADLE);
  if (!hasEasGradleApply) {
    await _fs().default.promises.writeFile(buildGradlePath, `${buildGradleContent.trim()}\n${APPLY_EAS_GRADLE}\n`);
  }
}
async function isEasBuildGradleConfiguredAsync(projectRoot) {
  const buildGradlePath = Paths().getAppBuildGradleFilePath(projectRoot);
  const easGradlePath = getEasBuildGradlePath(projectRoot);
  const hasEasGradleFile = await _fs().default.existsSync(easGradlePath);
  const buildGradleContent = await _fs().default.promises.readFile(_path().default.join(buildGradlePath), 'utf8');
  const hasEasGradleApply = hasApplyLine(buildGradleContent, APPLY_EAS_GRADLE);
  return hasEasGradleApply && hasEasGradleFile;
}
//# sourceMappingURL=EasBuild.js.map