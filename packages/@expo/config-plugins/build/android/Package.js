"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getApplicationIdAsync = getApplicationIdAsync;
exports.getPackage = getPackage;
exports.renameJniOnDiskForType = renameJniOnDiskForType;
exports.renamePackageOnDisk = renamePackageOnDisk;
exports.renamePackageOnDiskForType = renamePackageOnDiskForType;
exports.setPackageInBuildGradle = setPackageInBuildGradle;
exports.withPackageRefactor = exports.withPackageGradle = void 0;
function _debug() {
  const data = _interopRequireDefault(require("debug"));
  _debug = function () {
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
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _Paths() {
  const data = require("./Paths");
  _Paths = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
function _withDangerousMod() {
  const data = require("../plugins/withDangerousMod");
  _withDangerousMod = function () {
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
function _warnings() {
  const data = require("../utils/warnings");
  _warnings = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = (0, _debug().default)('expo:config-plugins:android:package');
const withPackageGradle = config => {
  return (0, _androidPlugins().withAppBuildGradle)(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setPackageInBuildGradle(config, config.modResults.contents);
    } else {
      (0, _warnings().addWarningAndroid)('android.package', `Cannot automatically configure app build.gradle if it's not groovy`);
    }
    return config;
  });
};
exports.withPackageGradle = withPackageGradle;
const withPackageRefactor = config => {
  return (0, _withDangerousMod().withDangerousMod)(config, ['android', async config => {
    await renamePackageOnDisk(config, config.modRequest.projectRoot);
    return config;
  }]);
};
exports.withPackageRefactor = withPackageRefactor;
function getPackage(config) {
  var _config$android$packa, _config$android;
  return (_config$android$packa = (_config$android = config.android) === null || _config$android === void 0 ? void 0 : _config$android.package) !== null && _config$android$packa !== void 0 ? _config$android$packa : null;
}
function getPackageRoot(projectRoot, type) {
  return _path().default.join(projectRoot, 'android', 'app', 'src', type, 'java');
}
function getCurrentPackageName(projectRoot, packageRoot) {
  const mainApplication = (0, _Paths().getProjectFilePath)(projectRoot, 'MainApplication');
  const packagePath = _path().default.dirname(mainApplication);
  const packagePathParts = _path().default.relative(packageRoot, packagePath).split(_path().default.sep).filter(Boolean);
  return packagePathParts.join('.');
}
function getCurrentPackageForProjectFile(projectRoot, packageRoot, fileName, type) {
  const filePath = (0, _glob().sync)(_path().default.join(projectRoot, `android/app/src/${type}/java/**/${fileName}.@(java|kt)`))[0];
  if (!filePath) {
    return null;
  }
  const packagePath = _path().default.dirname(filePath);
  const packagePathParts = _path().default.relative(packageRoot, packagePath).split(_path().default.sep).filter(Boolean);
  return packagePathParts.join('.');
}
function getCurrentPackageNameForType(projectRoot, type) {
  const packageRoot = getPackageRoot(projectRoot, type);
  if (type === 'main') {
    return getCurrentPackageName(projectRoot, packageRoot);
  }
  // debug, etc..
  return getCurrentPackageForProjectFile(projectRoot, packageRoot, '*', type);
}

// NOTE(brentvatne): this assumes that our MainApplication.java file is in the root of the package
// this makes sense for standard react-native projects but may not apply in customized projects, so if
// we want this to be runnable in any app we need to handle other possibilities
async function renamePackageOnDisk(config, projectRoot) {
  const newPackageName = getPackage(config);
  if (newPackageName === null) {
    return;
  }
  for (const type of ['debug', 'main', 'release']) {
    await renameJniOnDiskForType({
      projectRoot,
      type,
      packageName: newPackageName
    });
    await renamePackageOnDiskForType({
      projectRoot,
      type,
      packageName: newPackageName
    });
  }
}
async function renameJniOnDiskForType({
  projectRoot,
  type,
  packageName
}) {
  if (!packageName) {
    return;
  }
  const currentPackageName = getCurrentPackageNameForType(projectRoot, type);
  if (!currentPackageName || !packageName || currentPackageName === packageName) {
    return;
  }
  const jniRoot = _path().default.join(projectRoot, 'android', 'app', 'src', type, 'jni');
  const filesToUpdate = [...(0, _glob().sync)('**/*', {
    cwd: jniRoot,
    absolute: true
  })];
  // Replace all occurrences of the path in the project
  filesToUpdate.forEach(filepath => {
    try {
      if (_fs().default.lstatSync(filepath).isFile() && ['.h', '.cpp'].includes(_path().default.extname(filepath))) {
        let contents = _fs().default.readFileSync(filepath).toString();
        contents = contents.replace(new RegExp(transformJavaClassDescriptor(currentPackageName).replace(/\//g, '\\/'), 'g'), transformJavaClassDescriptor(packageName));
        _fs().default.writeFileSync(filepath, contents);
      }
    } catch {
      debug(`Error updating "${filepath}" for type "${type}"`);
    }
  });
}
async function renamePackageOnDiskForType({
  projectRoot,
  type,
  packageName
}) {
  if (!packageName) {
    return;
  }
  const currentPackageName = getCurrentPackageNameForType(projectRoot, type);
  debug(`Found package "${currentPackageName}" for type "${type}"`);
  if (!currentPackageName || currentPackageName === packageName) {
    return;
  }
  debug(`Refactor "${currentPackageName}" to "${packageName}" for type "${type}"`);
  const packageRoot = getPackageRoot(projectRoot, type);
  // Set up our paths
  if (!(await (0, _modules().directoryExistsAsync)(packageRoot))) {
    debug(`- skipping refactor of missing directory: ${packageRoot}`);
    return;
  }
  const currentPackagePath = _path().default.join(packageRoot, ...currentPackageName.split('.'));
  const newPackagePath = _path().default.join(packageRoot, ...packageName.split('.'));

  // Create the new directory
  _fs().default.mkdirSync(newPackagePath, {
    recursive: true
  });

  // Move everything from the old directory over
  (0, _glob().sync)('**/*', {
    cwd: currentPackagePath
  }).forEach(relativePath => {
    const filepath = _path().default.join(currentPackagePath, relativePath);
    if (_fs().default.lstatSync(filepath).isFile()) {
      moveFileSync(filepath, _path().default.join(newPackagePath, relativePath));
    } else {
      _fs().default.mkdirSync(filepath, {
        recursive: true
      });
    }
  });

  // Remove the old directory recursively from com/old/package to com/old and com,
  // as long as the directories are empty
  const oldPathParts = currentPackageName.split('.');
  while (oldPathParts.length) {
    const pathToCheck = _path().default.join(packageRoot, ...oldPathParts);
    try {
      const files = _fs().default.readdirSync(pathToCheck);
      if (files.length === 0) {
        _fs().default.rmdirSync(pathToCheck);
      }
    } finally {
      oldPathParts.pop();
    }
  }
  const filesToUpdate = [...(0, _glob().sync)('**/*', {
    cwd: newPackagePath,
    absolute: true
  })];
  // Only update the BUCK file to match the main package name
  if (type === 'main') {
    // NOTE(EvanBacon): We dropped this file in SDK 48 but other templates may still use it.
    filesToUpdate.push(_path().default.join(projectRoot, 'android', 'app', 'BUCK'));
  }
  // Replace all occurrences of the path in the project
  filesToUpdate.forEach(filepath => {
    try {
      if (_fs().default.lstatSync(filepath).isFile()) {
        let contents = _fs().default.readFileSync(filepath).toString();
        contents = replacePackageName(contents, currentPackageName, packageName);
        if (['.h', '.cpp'].includes(_path().default.extname(filepath))) {
          contents = contents.replace(new RegExp(transformJavaClassDescriptor(currentPackageName).replace(/\//g, '\\'), 'g'), transformJavaClassDescriptor(packageName));
        }
        _fs().default.writeFileSync(filepath, contents);
      }
    } catch {
      debug(`Error updating "${filepath}" for type "${type}"`);
    }
  });
}
function moveFileSync(src, dest) {
  _fs().default.mkdirSync(_path().default.dirname(dest), {
    recursive: true
  });
  _fs().default.renameSync(src, dest);
}
function setPackageInBuildGradle(config, buildGradle) {
  const packageName = getPackage(config);
  if (packageName === null) {
    return buildGradle;
  }
  const pattern = new RegExp(`(applicationId|namespace) ['"].*['"]`, 'g');
  return buildGradle.replace(pattern, `$1 '${packageName}'`);
}
async function getApplicationIdAsync(projectRoot) {
  var _matchResult$;
  const buildGradlePath = (0, _Paths().getAppBuildGradleFilePath)(projectRoot);
  if (!_fs().default.existsSync(buildGradlePath)) {
    return null;
  }
  const buildGradle = await _fs().default.promises.readFile(buildGradlePath, 'utf8');
  const matchResult = buildGradle.match(/applicationId ['"](.*)['"]/);
  // TODO add fallback for legacy cases to read from AndroidManifest.xml
  return (_matchResult$ = matchResult === null || matchResult === void 0 ? void 0 : matchResult[1]) !== null && _matchResult$ !== void 0 ? _matchResult$ : null;
}

/**
 * Replace the package name with the new package name, in the given source.
 * This has to be limited to avoid accidentally replacing imports when the old package name overlaps.
 */
function replacePackageName(content, oldName, newName) {
  const oldNameEscaped = oldName.replace(/\./g, '\\.');
  return content
  // Replace any quoted instances "com.old" -> "com.new"
  .replace(new RegExp(`"${oldNameEscaped}"`, 'g'), `"${newName}"`)
  // Replace special non-quoted instances, only when prefixed by package or namespace
  .replace(new RegExp(`(package|namespace)(\\s+)${oldNameEscaped}`, 'g'), `$1$2${newName}`)
  // Replace special import instances, without overlapping with other imports (trailing `.` to close it off)
  .replace(new RegExp(`(import\\s+)${oldNameEscaped}\\.`, 'g'), `$1${newName}.`);
}

/**
 * Transform a java package name to java class descriptor,
 * e.g. `com.helloworld` -> `Lcom/helloworld`.
 */
function transformJavaClassDescriptor(packageName) {
  return `L${packageName.replace(/\./g, '/')}`;
}
//# sourceMappingURL=Package.js.map