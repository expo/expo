"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildHermesBundleAsync = buildHermesBundleAsync;
exports.createHermesSourcemapAsync = createHermesSourcemapAsync;
exports.getHermesBytecodeBundleVersionAsync = getHermesBytecodeBundleVersionAsync;
exports.isEnableHermesManaged = isEnableHermesManaged;
exports.isHermesBytecodeBundleAsync = isHermesBytecodeBundleAsync;
exports.maybeInconsistentEngineAndroidAsync = maybeInconsistentEngineAndroidAsync;
exports.maybeInconsistentEngineIosAsync = maybeInconsistentEngineIosAsync;
exports.maybeThrowFromInconsistentEngineAsync = maybeThrowFromInconsistentEngineAsync;
exports.parseGradleProperties = parseGradleProperties;

function _spawnAsync() {
  const data = _interopRequireDefault(require("@expo/spawn-async"));

  _spawnAsync = function () {
    return data;
  };

  return data;
}

function _fsExtra() {
  const data = _interopRequireDefault(require("fs-extra"));

  _fsExtra = function () {
    return data;
  };

  return data;
}

function _os() {
  const data = _interopRequireDefault(require("os"));

  _os = function () {
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

function _process() {
  const data = _interopRequireDefault(require("process"));

  _process = function () {
    return data;
  };

  return data;
}

function _semver() {
  const data = _interopRequireDefault(require("semver"));

  _semver = function () {
    return data;
  };

  return data;
}

function _importMetroFromProject() {
  const data = require("./metro/importMetroFromProject");

  _importMetroFromProject = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isEnableHermesManaged(expoConfig, platform) {
  switch (platform) {
    case 'android':
      {
        var _expoConfig$android$j, _expoConfig$android;

        if (!gteSdkVersion(expoConfig, '42.0.0')) {
          // Hermes on Android is supported after SDK 42.
          return false;
        }

        return ((_expoConfig$android$j = (_expoConfig$android = expoConfig.android) === null || _expoConfig$android === void 0 ? void 0 : _expoConfig$android.jsEngine) !== null && _expoConfig$android$j !== void 0 ? _expoConfig$android$j : expoConfig.jsEngine) === 'hermes';
      }

    case 'ios':
      {
        var _expoConfig$ios$jsEng, _expoConfig$ios;

        if (!gteSdkVersion(expoConfig, '43.0.0')) {
          // Hermes on iOS is supported after SDK 43.
          return false;
        }

        return ((_expoConfig$ios$jsEng = (_expoConfig$ios = expoConfig.ios) === null || _expoConfig$ios === void 0 ? void 0 : _expoConfig$ios.jsEngine) !== null && _expoConfig$ios$jsEng !== void 0 ? _expoConfig$ios$jsEng : expoConfig.jsEngine) === 'hermes';
      }

    default:
      return false;
  }
}

async function buildHermesBundleAsync(projectRoot, code, map, optimize = false) {
  const tempDir = _path().default.join(_os().default.tmpdir(), `expo-bundler-${_process().default.pid}`);

  await _fsExtra().default.ensureDir(tempDir);

  try {
    const tempBundleFile = _path().default.join(tempDir, 'index.bundle');

    const tempSourcemapFile = _path().default.join(tempDir, 'index.bundle.map');

    await _fsExtra().default.writeFile(tempBundleFile, code);
    await _fsExtra().default.writeFile(tempSourcemapFile, map);

    const tempHbcFile = _path().default.join(tempDir, 'index.hbc');

    const hermesCommand = (0, _importMetroFromProject().importHermesCommandFromProject)(projectRoot);
    const args = ['-emit-binary', '-out', tempHbcFile, tempBundleFile, '-output-source-map'];

    if (optimize) {
      args.push('-O');
    }

    await (0, _spawnAsync().default)(hermesCommand, args);
    const [hbc, sourcemap] = await Promise.all([_fsExtra().default.readFile(tempHbcFile), createHermesSourcemapAsync(projectRoot, map, `${tempHbcFile}.map`)]);
    return {
      hbc,
      sourcemap
    };
  } finally {
    await _fsExtra().default.remove(tempDir);
  }
}

async function createHermesSourcemapAsync(projectRoot, sourcemap, hermesMapFile) {
  const composeSourceMaps = (0, _importMetroFromProject().importMetroSourceMapComposeSourceMapsFromProject)(projectRoot);
  const bundlerSourcemap = JSON.parse(sourcemap);
  const hermesSourcemap = await _fsExtra().default.readJSON(hermesMapFile);
  return JSON.stringify(composeSourceMaps([bundlerSourcemap, hermesSourcemap]));
}

function parseGradleProperties(content) {
  const result = {};

  for (let line of content.split('\n')) {
    line = line.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const sepIndex = line.indexOf('=');
    const key = line.substr(0, sepIndex);
    const value = line.substr(sepIndex + 1);
    result[key] = value;
  }

  return result;
}

async function maybeThrowFromInconsistentEngineAsync(projectRoot, configFilePath, platform, isHermesManaged) {
  const configFileName = _path().default.basename(configFilePath);

  if (platform === 'android' && (await maybeInconsistentEngineAndroidAsync(projectRoot, isHermesManaged))) {
    throw new Error(`JavaScript engine configuration is inconsistent between ${configFileName} and Android native project.\n` + `In ${configFileName}: Hermes is ${isHermesManaged ? 'enabled' : 'not enabled'}\n` + `In Android native project: Hermes is ${isHermesManaged ? 'not enabled' : 'enabled'}\n` + `Please check the following files for inconsistencies:\n` + `  - ${configFilePath}\n` + `  - ${_path().default.join(projectRoot, 'android', 'gradle.properties')}\n` + `  - ${_path().default.join(projectRoot, 'android', 'app', 'build.gradle')}\n` + 'Learn more: https://expo.fyi/hermes-android-config');
  }

  if (platform === 'ios' && (await maybeInconsistentEngineIosAsync(projectRoot, isHermesManaged))) {
    throw new Error(`JavaScript engine configuration is inconsistent between ${configFileName} and iOS native project.\n` + `In ${configFileName}: Hermes is ${isHermesManaged ? 'enabled' : 'not enabled'}\n` + `In iOS native project: Hermes is ${isHermesManaged ? 'not enabled' : 'enabled'}\n` + `Please check the following files for inconsistencies:\n` + `  - ${configFilePath}\n` + `  - ${_path().default.join(projectRoot, 'ios', 'Podfile')}\n` + `  - ${_path().default.join(projectRoot, 'ios', 'Podfile.properties.json')}\n` + 'Learn more: https://expo.fyi/hermes-ios-config');
  }
}

async function maybeInconsistentEngineAndroidAsync(projectRoot, isHermesManaged) {
  // Trying best to check android native project if by chance to be consistent between app config
  // Check android/app/build.gradle for "enableHermes: true"
  const appBuildGradlePath = _path().default.join(projectRoot, 'android', 'app', 'build.gradle');

  if (_fsExtra().default.existsSync(appBuildGradlePath)) {
    const content = await _fsExtra().default.readFile(appBuildGradlePath, 'utf8');
    const isPropsReference = content.search(/^\s*enableHermes:\s*\(findProperty\('expo.jsEngine'\) \?: "jsc"\) == "hermes",?\s+/m) >= 0;
    const isHermesBare = content.search(/^\s*enableHermes:\s*true,?\s+/m) >= 0;

    if (!isPropsReference && isHermesManaged !== isHermesBare) {
      return true;
    }
  } // Check gradle.properties from prebuild template


  const gradlePropertiesPath = _path().default.join(projectRoot, 'android', 'gradle.properties');

  if (_fsExtra().default.existsSync(gradlePropertiesPath)) {
    const props = parseGradleProperties(await _fsExtra().default.readFile(gradlePropertiesPath, 'utf8'));
    const isHermesBare = props['expo.jsEngine'] === 'hermes';

    if (isHermesManaged !== isHermesBare) {
      return true;
    }
  }

  return false;
}

async function maybeInconsistentEngineIosAsync(projectRoot, isHermesManaged) {
  // Trying best to check ios native project if by chance to be consistent between app config
  // Check ios/Podfile for ":hermes_enabled => true"
  const podfilePath = _path().default.join(projectRoot, 'ios', 'Podfile');

  if (_fsExtra().default.existsSync(podfilePath)) {
    const content = await _fsExtra().default.readFile(podfilePath, 'utf8');
    const hermesPropReferences = [// sdk 45
    /^\s*:hermes_enabled\s*=>\s*flags\[:hermes_enabled\]\s*\|\|\s*podfile_properties\['expo.jsEngine'\]\s*==\s*'hermes',?/m, // <= sdk 44
    /^\s*:hermes_enabled\s*=>\s*podfile_properties\['expo.jsEngine'\] == 'hermes',?\s+/m];
    const isPropsReference = hermesPropReferences.reduce((prev, curr) => prev || content.search(curr) >= 0, false);
    const isHermesBare = content.search(/^\s*:hermes_enabled\s*=>\s*true,?\s+/m) >= 0;

    if (!isPropsReference && isHermesManaged !== isHermesBare) {
      return true;
    }
  } // Check Podfile.properties.json from prebuild template


  const podfilePropertiesPath = _path().default.join(projectRoot, 'ios', 'Podfile.properties.json');

  if (_fsExtra().default.existsSync(podfilePropertiesPath)) {
    const props = await parsePodfilePropertiesAsync(podfilePropertiesPath);
    const isHermesBare = props['expo.jsEngine'] === 'hermes';

    if (isHermesManaged !== isHermesBare) {
      return true;
    }
  }

  return false;
} // https://github.com/facebook/hermes/blob/release-v0.5/include/hermes/BCGen/HBC/BytecodeFileFormat.h#L24-L25


const HERMES_MAGIC_HEADER = 'c61fbc03c103191f';

async function isHermesBytecodeBundleAsync(file) {
  const header = await readHermesHeaderAsync(file);
  return header.slice(0, 8).toString('hex') === HERMES_MAGIC_HEADER;
}

async function getHermesBytecodeBundleVersionAsync(file) {
  const header = await readHermesHeaderAsync(file);

  if (header.slice(0, 8).toString('hex') !== HERMES_MAGIC_HEADER) {
    throw new Error('Invalid hermes bundle file');
  }

  return header.readUInt32LE(8);
}

async function readHermesHeaderAsync(file) {
  const fd = await _fsExtra().default.open(file, 'r');
  const buffer = Buffer.alloc(12);
  await _fsExtra().default.read(fd, buffer, 0, 12, null);
  await _fsExtra().default.close(fd);
  return buffer;
} // Cloned from xdl/src/Versions.ts, we cannot use that because of circular dependency


function gteSdkVersion(expJson, sdkVersion) {
  if (!expJson.sdkVersion) {
    return false;
  }

  if (expJson.sdkVersion === 'UNVERSIONED') {
    return true;
  }

  try {
    return _semver().default.gte(expJson.sdkVersion, sdkVersion);
  } catch {
    throw new Error(`${expJson.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
  }
}

async function parsePodfilePropertiesAsync(podfilePropertiesPath) {
  try {
    return JSON.parse(await _fsExtra().default.readFile(podfilePropertiesPath, 'utf8'));
  } catch {
    return {};
  }
}
//# sourceMappingURL=HermesBundler.js.map