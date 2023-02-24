"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyPlugin = applyPlugin;
exports.getGoogleServicesFilePath = getGoogleServicesFilePath;
exports.setClassPath = setClassPath;
exports.setGoogleServicesFile = setGoogleServicesFile;
exports.withGoogleServicesFile = exports.withClassPath = exports.withApplyPlugin = void 0;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
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
function _fs() {
  const data = require("../utils/fs");
  _fs = function () {
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
const DEFAULT_TARGET_PATH = './android/app/google-services.json';
const googleServicesClassPath = 'com.google.gms:google-services';
const googleServicesPlugin = 'com.google.gms.google-services';

// NOTE(brentvatne): This may be annoying to keep up to date...
const googleServicesVersion = '4.3.3';
const withClassPath = config => {
  return (0, _androidPlugins().withProjectBuildGradle)(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setClassPath(config, config.modResults.contents);
    } else {
      (0, _warnings().addWarningAndroid)('android.googleServicesFile', `Cannot automatically configure project build.gradle if it's not groovy`);
    }
    return config;
  });
};
exports.withClassPath = withClassPath;
const withApplyPlugin = config => {
  return (0, _androidPlugins().withAppBuildGradle)(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = applyPlugin(config, config.modResults.contents);
    } else {
      (0, _warnings().addWarningAndroid)('android.googleServicesFile', `Cannot automatically configure app build.gradle if it's not groovy`);
    }
    return config;
  });
};

/**
 * Add `google-services.json` to project
 */
exports.withApplyPlugin = withApplyPlugin;
const withGoogleServicesFile = config => {
  return (0, _withDangerousMod().withDangerousMod)(config, ['android', async config => {
    await setGoogleServicesFile(config, config.modRequest.projectRoot);
    return config;
  }]);
};
exports.withGoogleServicesFile = withGoogleServicesFile;
function getGoogleServicesFilePath(config) {
  var _config$android$googl, _config$android;
  return (_config$android$googl = (_config$android = config.android) === null || _config$android === void 0 ? void 0 : _config$android.googleServicesFile) !== null && _config$android$googl !== void 0 ? _config$android$googl : null;
}
async function setGoogleServicesFile(config, projectRoot, targetPath = DEFAULT_TARGET_PATH) {
  const partialSourcePath = getGoogleServicesFilePath(config);
  if (!partialSourcePath) {
    return false;
  }
  const completeSourcePath = _path().default.resolve(projectRoot, partialSourcePath);
  const destinationPath = _path().default.resolve(projectRoot, targetPath);
  try {
    await (0, _fs().copyFilePathToPathAsync)(completeSourcePath, destinationPath);
  } catch (e) {
    console.log(e);
    throw new Error(`Cannot copy google-services.json from ${completeSourcePath} to ${destinationPath}. Please make sure the source and destination paths exist.`);
  }
  return true;
}

/**
 * Adding the Google Services plugin
 * NOTE(brentvatne): string replacement is a fragile approach! we need a
 * better solution than this.
 */
function setClassPath(config, buildGradle) {
  const googleServicesFile = getGoogleServicesFilePath(config);
  if (!googleServicesFile) {
    return buildGradle;
  }
  if (buildGradle.includes(googleServicesClassPath)) {
    return buildGradle;
  }

  //
  return buildGradle.replace(/dependencies\s?{/, `dependencies {
        classpath '${googleServicesClassPath}:${googleServicesVersion}'`);
}
function applyPlugin(config, appBuildGradle) {
  const googleServicesFile = getGoogleServicesFilePath(config);
  if (!googleServicesFile) {
    return appBuildGradle;
  }

  // Make sure the project does not have the plugin already
  const pattern = new RegExp(`apply\\s+plugin:\\s+['"]${googleServicesPlugin}['"]`);
  if (appBuildGradle.match(pattern)) {
    return appBuildGradle;
  }

  // Add it to the end of the file
  return appBuildGradle + `\napply plugin: '${googleServicesPlugin}'`;
}
//# sourceMappingURL=GoogleServices.js.map