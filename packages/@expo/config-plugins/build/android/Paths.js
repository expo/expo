"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAndroidManifestAsync = getAndroidManifestAsync;
exports.getAppBuildGradleAsync = getAppBuildGradleAsync;
exports.getAppBuildGradleFilePath = getAppBuildGradleFilePath;
exports.getFileInfo = getFileInfo;
exports.getGradleFilePath = getGradleFilePath;
exports.getMainActivityAsync = getMainActivityAsync;
exports.getMainApplicationAsync = getMainApplicationAsync;
exports.getProjectBuildGradleAsync = getProjectBuildGradleAsync;
exports.getProjectBuildGradleFilePath = getProjectBuildGradleFilePath;
exports.getProjectFilePath = getProjectFilePath;
exports.getProjectPathOrThrowAsync = getProjectPathOrThrowAsync;
exports.getResourceFolderAsync = getResourceFolderAsync;
exports.getResourceXMLPathAsync = getResourceXMLPathAsync;
exports.getSettingsGradleAsync = getSettingsGradleAsync;
exports.getSettingsGradleFilePath = getSettingsGradleFilePath;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
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
function _glob() {
  const data = require("glob");
  _glob = function () {
    return data;
  };
  return data;
}
function path() {
  const data = _interopRequireWildcard(require("path"));
  path = function () {
    return data;
  };
  return data;
}
function _errors() {
  const data = require("../utils/errors");
  _errors = function () {
    return data;
  };
  return data;
}
function _modules() {
  const data = require("../utils/modules");
  _modules = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getProjectFilePath(projectRoot, name) {
  const filePath = (0, _glob().sync)(path().join(projectRoot, `android/app/src/main/java/**/${name}.@(java|kt)`))[0];
  (0, _assert().default)(filePath, `Project file "${name}" does not exist in android project for root "${projectRoot}"`);
  return filePath;
}
function getLanguage(filePath) {
  const extension = path().extname(filePath);
  switch (extension) {
    case '.java':
      return 'java';
    case '.kts':
    case '.kt':
      return 'kt';
    case '.groovy':
    case '.gradle':
      return 'groovy';
    default:
      throw new (_errors().UnexpectedError)(`Unexpected Android file extension: ${extension}`);
  }
}
function getFileInfo(filePath) {
  return {
    path: path().normalize(filePath),
    contents: _fs().default.readFileSync(filePath, 'utf8'),
    language: getLanguage(filePath)
  };
}
async function getMainApplicationAsync(projectRoot) {
  const filePath = getProjectFilePath(projectRoot, 'MainApplication');
  return getFileInfo(filePath);
}
async function getMainActivityAsync(projectRoot) {
  const filePath = getProjectFilePath(projectRoot, 'MainActivity');
  return getFileInfo(filePath);
}
function getGradleFilePath(projectRoot, gradleName) {
  const groovyPath = path().resolve(projectRoot, `${gradleName}.gradle`);
  const ktPath = path().resolve(projectRoot, `${gradleName}.gradle.kts`);
  const isGroovy = _fs().default.existsSync(groovyPath);
  const isKotlin = !isGroovy && _fs().default.existsSync(ktPath);
  if (!isGroovy && !isKotlin) {
    throw new Error(`Failed to find '${gradleName}.gradle' file for project: ${projectRoot}.`);
  }
  const filePath = isGroovy ? groovyPath : ktPath;
  return filePath;
}
function getProjectBuildGradleFilePath(projectRoot) {
  return getGradleFilePath(path().join(projectRoot, 'android'), 'build');
}
async function getProjectBuildGradleAsync(projectRoot) {
  return getFileInfo(getProjectBuildGradleFilePath(projectRoot));
}
function getSettingsGradleFilePath(projectRoot) {
  return getGradleFilePath(path().join(projectRoot, 'android'), 'settings');
}
async function getSettingsGradleAsync(projectRoot) {
  return getFileInfo(getSettingsGradleFilePath(projectRoot));
}
function getAppBuildGradleFilePath(projectRoot) {
  return getGradleFilePath(path().join(projectRoot, 'android', 'app'), 'build');
}
async function getAppBuildGradleAsync(projectRoot) {
  return getFileInfo(getAppBuildGradleFilePath(projectRoot));
}
async function getProjectPathOrThrowAsync(projectRoot) {
  const projectPath = path().join(projectRoot, 'android');
  if (await (0, _modules().directoryExistsAsync)(projectPath)) {
    return projectPath;
  }
  throw new Error(`Android project folder is missing in project: ${projectRoot}`);
}
async function getAndroidManifestAsync(projectRoot) {
  const projectPath = await getProjectPathOrThrowAsync(projectRoot);
  const filePath = path().join(projectPath, 'app/src/main/AndroidManifest.xml');
  return filePath;
}
async function getResourceFolderAsync(projectRoot) {
  const projectPath = await getProjectPathOrThrowAsync(projectRoot);
  return path().join(projectPath, `app/src/main/res`);
}
async function getResourceXMLPathAsync(projectRoot, {
  kind = 'values',
  name
}) {
  const resourcePath = await getResourceFolderAsync(projectRoot);
  const filePath = path().join(resourcePath, `${kind}/${name}.xml`);
  return filePath;
}
//# sourceMappingURL=Paths.js.map