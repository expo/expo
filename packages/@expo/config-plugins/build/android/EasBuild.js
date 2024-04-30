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
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
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