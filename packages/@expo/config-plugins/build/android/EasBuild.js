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
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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