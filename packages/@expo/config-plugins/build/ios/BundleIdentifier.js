"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBundleIdentifier = getBundleIdentifier;
exports.getBundleIdentifierFromPbxproj = getBundleIdentifierFromPbxproj;
exports.resetAllPlistBundleIdentifiers = resetAllPlistBundleIdentifiers;
exports.resetPlistBundleIdentifier = resetPlistBundleIdentifier;
exports.setBundleIdentifier = setBundleIdentifier;
exports.setBundleIdentifierForPbxproj = setBundleIdentifierForPbxproj;
exports.updateBundleIdentifierForPbxproj = updateBundleIdentifierForPbxproj;
exports.withBundleIdentifier = void 0;

function _plist() {
  const data = _interopRequireDefault(require("@expo/plist"));

  _plist = function () {
    return data;
  };

  return data;
}

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

function _xcode() {
  const data = _interopRequireDefault(require("xcode"));

  _xcode = function () {
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

function _Paths() {
  const data = require("./Paths");

  _Paths = function () {
    return data;
  };

  return data;
}

function _Target() {
  const data = require("./Target");

  _Target = function () {
    return data;
  };

  return data;
}

function _Xcodeproj() {
  const data = require("./utils/Xcodeproj");

  _Xcodeproj = function () {
    return data;
  };

  return data;
}

function _string() {
  const data = require("./utils/string");

  _string = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const withBundleIdentifier = (config, {
  bundleIdentifier
}) => {
  return (0, _withDangerousMod().withDangerousMod)(config, ['ios', async config => {
    var _config$ios;

    const bundleId = bundleIdentifier !== null && bundleIdentifier !== void 0 ? bundleIdentifier : (_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : _config$ios.bundleIdentifier;
    (0, _assert().default)(bundleId, '`bundleIdentifier` must be defined in the app config (`expo.ios.bundleIdentifier`) or passed to the plugin `withBundleIdentifier`.');
    await setBundleIdentifierForPbxproj(config.modRequest.projectRoot, bundleId);
    return config;
  }]);
};

exports.withBundleIdentifier = withBundleIdentifier;

function getBundleIdentifier(config) {
  var _config$ios$bundleIde, _config$ios2;

  return (_config$ios$bundleIde = (_config$ios2 = config.ios) === null || _config$ios2 === void 0 ? void 0 : _config$ios2.bundleIdentifier) !== null && _config$ios$bundleIde !== void 0 ? _config$ios$bundleIde : null;
}
/**
 * In Turtle v1 we set the bundleIdentifier directly on Info.plist rather
 * than in pbxproj
 */


function setBundleIdentifier(config, infoPlist) {
  const bundleIdentifier = getBundleIdentifier(config);

  if (!bundleIdentifier) {
    return infoPlist;
  }

  return { ...infoPlist,
    CFBundleIdentifier: bundleIdentifier
  };
}
/**
 * Gets the bundle identifier defined in the Xcode project found in the project directory.
 *
 * A bundle identifier is stored as a value in XCBuildConfiguration entry.
 * Those entries exist for every pair (build target, build configuration).
 * Unless target name is passed, the first target defined in the pbxproj is used
 * (to keep compatibility with the inaccurate legacy implementation of this function).
 * The build configuration is usually 'Release' or 'Debug'. However, it could be any arbitrary string.
 * Defaults to 'Release'.
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {string} targetName Target name
 * @param {string} buildConfiguration Build configuration. Defaults to 'Release'.
 * @returns {string | null} bundle identifier of the Xcode project or null if the project is not configured
 */


function getBundleIdentifierFromPbxproj(projectRoot, {
  targetName,
  buildConfiguration = 'Release'
} = {}) {
  let pbxprojPath;

  try {
    pbxprojPath = (0, _Paths().getPBXProjectPath)(projectRoot);
  } catch {
    return null;
  }

  const project = _xcode().default.project(pbxprojPath);

  project.parseSync();
  const xcBuildConfiguration = (0, _Target().getXCBuildConfigurationFromPbxproj)(project, {
    targetName,
    buildConfiguration
  });

  if (!xcBuildConfiguration) {
    return null;
  }

  return getProductBundleIdentifierFromBuildConfiguration(xcBuildConfiguration);
}

function getProductBundleIdentifierFromBuildConfiguration(xcBuildConfiguration) {
  const bundleIdentifierRaw = xcBuildConfiguration.buildSettings.PRODUCT_BUNDLE_IDENTIFIER;

  if (bundleIdentifierRaw) {
    const bundleIdentifier = (0, _string().trimQuotes)(bundleIdentifierRaw); // it's possible to use interpolation for the bundle identifier
    // the most common case is when the last part of the id is set to `$(PRODUCT_NAME:rfc1034identifier)`
    // in this case, PRODUCT_NAME should be replaced with its value
    // the `rfc1034identifier` modifier replaces all non-alphanumeric characters with dashes

    const bundleIdentifierParts = bundleIdentifier.split('.');

    if (bundleIdentifierParts[bundleIdentifierParts.length - 1] === '$(PRODUCT_NAME:rfc1034identifier)' && xcBuildConfiguration.buildSettings.PRODUCT_NAME) {
      bundleIdentifierParts[bundleIdentifierParts.length - 1] = xcBuildConfiguration.buildSettings.PRODUCT_NAME.replace(/[^a-zA-Z0-9]/g, '-');
    }

    return bundleIdentifierParts.join('.');
  } else {
    return null;
  }
}
/**
 * Updates the bundle identifier for a given pbxproj
 *
 * @param {string} pbxprojPath Path to pbxproj file
 * @param {string} bundleIdentifier Bundle identifier to set in the pbxproj
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */


function updateBundleIdentifierForPbxproj(pbxprojPath, bundleIdentifier, updateProductName = true) {
  const project = _xcode().default.project(pbxprojPath);

  project.parseSync();
  const [, nativeTarget] = (0, _Target().findFirstNativeTarget)(project);
  (0, _Xcodeproj().getBuildConfigurationsForListId)(project, nativeTarget.buildConfigurationList).forEach(([, item]) => {
    if (item.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === bundleIdentifier) {
      return;
    }

    item.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${bundleIdentifier}"`;

    if (updateProductName) {
      const productName = bundleIdentifier.split('.').pop();

      if (!(productName !== null && productName !== void 0 && productName.includes('$'))) {
        item.buildSettings.PRODUCT_NAME = productName;
      }
    }
  });

  _fs().default.writeFileSync(pbxprojPath, project.writeSync());
}
/**
 * Updates the bundle identifier for pbx projects inside the ios directory of the given project root
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {string} bundleIdentifier Desired bundle identifier
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */


function setBundleIdentifierForPbxproj(projectRoot, bundleIdentifier, updateProductName = true) {
  // Get all pbx projects in the ${projectRoot}/ios directory
  let pbxprojPaths = [];

  try {
    pbxprojPaths = (0, _Paths().getAllPBXProjectPaths)(projectRoot);
  } catch {}

  for (const pbxprojPath of pbxprojPaths) {
    updateBundleIdentifierForPbxproj(pbxprojPath, bundleIdentifier, updateProductName);
  }
}
/**
 * Reset bundle identifier field in Info.plist to use PRODUCT_BUNDLE_IDENTIFIER, as recommended by Apple.
 */


const defaultBundleId = '$(PRODUCT_BUNDLE_IDENTIFIER)';

function resetAllPlistBundleIdentifiers(projectRoot) {
  const infoPlistPaths = (0, _Paths().getAllInfoPlistPaths)(projectRoot);

  for (const plistPath of infoPlistPaths) {
    resetPlistBundleIdentifier(plistPath);
  }
}

function resetPlistBundleIdentifier(plistPath) {
  const rawPlist = _fs().default.readFileSync(plistPath, 'utf8');

  const plistObject = _plist().default.parse(rawPlist);

  if (plistObject.CFBundleIdentifier) {
    if (plistObject.CFBundleIdentifier === defaultBundleId) return; // attempt to match default Info.plist format

    const format = {
      pretty: true,
      indent: `\t`
    };

    const xml = _plist().default.build({ ...plistObject,
      CFBundleIdentifier: defaultBundleId
    }, format);

    if (xml !== rawPlist) {
      _fs().default.writeFileSync(plistPath, xml);
    }
  }
}
//# sourceMappingURL=BundleIdentifier.js.map