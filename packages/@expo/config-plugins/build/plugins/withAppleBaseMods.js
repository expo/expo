"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withAppleBaseMods = exports.getAppleModFileProviders = void 0;
function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));
  _jsonFile = function () {
    return data;
  };
  return data;
}
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
  const data = _interopRequireWildcard(require("fs"));
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
function _xcode() {
  const data = _interopRequireDefault(require("xcode"));
  _xcode = function () {
    return data;
  };
  return data;
}
function _createBaseMod() {
  const data = require("./createBaseMod");
  _createBaseMod = function () {
    return data;
  };
  return data;
}
function _apple() {
  const data = require("../apple");
  _apple = function () {
    return data;
  };
  return data;
}
function _Entitlements() {
  const data = require("../apple/Entitlements");
  _Entitlements = function () {
    return data;
  };
  return data;
}
function _Xcodeproj() {
  const data = require("../apple/utils/Xcodeproj");
  _Xcodeproj = function () {
    return data;
  };
  return data;
}
function _getInfoPlistPath() {
  const data = require("../apple/utils/getInfoPlistPath");
  _getInfoPlistPath = function () {
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
function _sortObject() {
  const data = require("../utils/sortObject");
  _sortObject = function () {
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
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const {
  readFile,
  writeFile
} = _fs().promises;
function getEntitlementsPlistTemplate() {
  // TODO: Fetch the versioned template file if possible
  return {};
}
function getInfoPlistTemplate() {
  // TODO: Fetch the versioned template file if possible
  return {
    CFBundleDevelopmentRegion: '$(DEVELOPMENT_LANGUAGE)',
    CFBundleExecutable: '$(EXECUTABLE_NAME)',
    CFBundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER)',
    CFBundleName: '$(PRODUCT_NAME)',
    CFBundlePackageType: '$(PRODUCT_BUNDLE_PACKAGE_TYPE)',
    CFBundleInfoDictionaryVersion: '6.0',
    CFBundleSignature: '????',
    LSRequiresIPhoneOS: true,
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: true,
      NSExceptionDomains: {
        localhost: {
          NSExceptionAllowsInsecureHTTPLoads: true
        }
      }
    },
    UILaunchStoryboardName: 'SplashScreen',
    UIRequiredDeviceCapabilities: ['armv7'],
    UIViewControllerBasedStatusBarAppearance: false,
    UIStatusBarStyle: 'UIStatusBarStyleDefault',
    CADisableMinimumFrameDurationOnPhone: true
  };
}
const defaultProviders = applePlatform => ({
  dangerous: (0, _createBaseMod().provider)({
    getFilePath() {
      return '';
    },
    async read() {
      return {};
    },
    async write() {}
  }),
  finalized: (0, _createBaseMod().provider)({
    getFilePath() {
      return '';
    },
    async read() {
      return {};
    },
    async write() {}
  }),
  // Append a rule to supply AppDelegate data to mods on `mods.ios.appDelegate`
  appDelegate: (0, _createBaseMod().provider)({
    getFilePath({
      modRequest: {
        projectRoot
      }
    }) {
      // TODO: Get application AppDelegate file from pbxproj.
      return _apple().Paths.getAppDelegateFilePath(applePlatform)(projectRoot);
    },
    async read(filePath) {
      return _apple().Paths.getFileInfo(filePath);
    },
    async write(filePath, {
      modResults: {
        contents
      }
    }) {
      await writeFile(filePath, contents);
    }
  }),
  // Append a rule to supply Expo.plist data to mods on `mods.ios.expoPlist` or
  // `mods.macos.expoPlist`
  expoPlist: (0, _createBaseMod().provider)({
    isIntrospective: true,
    getFilePath({
      modRequest: {
        platformProjectRoot,
        projectName
      }
    }) {
      const supportingDirectory = _path().default.join(platformProjectRoot, projectName, 'Supporting');
      return _path().default.resolve(supportingDirectory, 'Expo.plist');
    },
    async read(filePath, {
      modRequest: {
        introspect
      }
    }) {
      try {
        return _plist().default.parse(await readFile(filePath, 'utf8'));
      } catch (error) {
        if (introspect) {
          return {};
        }
        throw error;
      }
    },
    async write(filePath, {
      modResults,
      modRequest: {
        introspect
      }
    }) {
      if (introspect) {
        return;
      }
      await writeFile(filePath, _plist().default.build((0, _sortObject().sortObject)(modResults)));
    }
  }),
  // Append a rule to supply .xcodeproj data to mods on `mods.ios.xcodeproj` or
  // `mods.macos.xcodeproj`
  xcodeproj: (0, _createBaseMod().provider)({
    getFilePath({
      modRequest: {
        projectRoot
      }
    }) {
      return _apple().Paths.getPBXProjectPath(applePlatform)(projectRoot);
    },
    async read(filePath) {
      const project = _xcode().default.project(filePath);
      project.parseSync();
      return project;
    },
    async write(filePath, {
      modResults
    }) {
      await writeFile(filePath, modResults.writeSync());
    }
  }),
  // Append a rule to supply Info.plist data to mods on `mods.ios.infoPlist` or
  // `mods.macos.infoPlist`
  infoPlist: (0, _createBaseMod().provider)({
    isIntrospective: true,
    async getFilePath(config) {
      let project = null;
      try {
        project = (0, _Xcodeproj().getPbxproj)(applePlatform)(config.modRequest.projectRoot);
      } catch {
        // noop
      }

      // Only check / warn if a project actually exists, this'll provide
      // more accurate warning messages for users in managed projects.
      if (project) {
        const infoPlistBuildProperty = (0, _getInfoPlistPath().getInfoPlistPathFromPbxproj)(applePlatform)(project);
        if (infoPlistBuildProperty) {
          //: [root]/myapp/[applePlatform]/MyApp/Info.plist
          const infoPlistPath = _path().default.join(
          //: myapp/[applePlatform]
          config.modRequest.platformProjectRoot,
          //: MyApp/Info.plist
          infoPlistBuildProperty);
          if ((0, _modules().fileExists)(infoPlistPath)) {
            return infoPlistPath;
          }
          (0, _warnings().addWarningForPlatform)(applePlatform, `mods.${applePlatform}.infoPlist`, `Info.plist file linked to Xcode project does not exist: ${infoPlistPath}`);
        } else {
          (0, _warnings().addWarningForPlatform)(applePlatform, `mods.${applePlatform}.infoPlist`, 'Failed to find Info.plist linked to Xcode project.');
        }
      }
      try {
        // Fallback on glob...
        return await _apple().Paths.getInfoPlistPath(applePlatform)(config.modRequest.projectRoot);
      } catch (error) {
        if (config.modRequest.introspect) {
          // fallback to an empty string in introspection mode.
          return '';
        }
        throw error;
      }
    },
    async read(filePath, config) {
      // Apply all of the Info.plist values to the `expo.ios.infoPlist` or
      // `expo.macos.infoPlist` object

      // TODO: Remove this in favor of just overwriting the Info.plist with the Expo object. This will enable people to actually remove values.
      if (!config[applePlatform]) config[applePlatform] = {};
      if (!config[applePlatform].infoPlist) config[applePlatform].infoPlist = {};
      let modResults;
      try {
        const contents = await readFile(filePath, 'utf8');
        (0, _assert().default)(contents, 'Info.plist is empty');
        modResults = _plist().default.parse(contents);
      } catch (error) {
        // Throw errors in introspection mode.
        if (!config.modRequest.introspect) {
          throw error;
        }
        // Fallback to using the infoPlist object from the Expo config.
        modResults = getInfoPlistTemplate();
      }
      config[applePlatform].infoPlist = {
        ...(modResults || {}),
        ...config[applePlatform].infoPlist
      };
      return config[applePlatform].infoPlist;
    },
    async write(filePath, config) {
      // Update the contents of the static infoPlist object
      if (!config[applePlatform]) {
        config[applePlatform] = {};
      }
      config[applePlatform].infoPlist = config.modResults;

      // Return early without writing, in introspection mode.
      if (config.modRequest.introspect) {
        return;
      }
      await writeFile(filePath, _plist().default.build((0, _sortObject().sortObject)(config.modResults)));
    }
  }),
  // Append a rule to supply .entitlements data to mods on
  // `mods.ios.entitlements` or `mods.macos.entitlements`
  entitlements: (0, _createBaseMod().provider)({
    isIntrospective: true,
    async getFilePath(config) {
      try {
        (0, _Entitlements().ensureApplicationTargetEntitlementsFileConfigured)(applePlatform)(config.modRequest.projectRoot);
        return _apple().Entitlements.getEntitlementsPath(applePlatform)(config.modRequest.projectRoot) ?? '';
      } catch (error) {
        if (config.modRequest.introspect) {
          // fallback to an empty string in introspection mode.
          return '';
        }
        throw error;
      }
    },
    async read(filePath, config) {
      let modResults;
      try {
        if (!config.modRequest.ignoreExistingNativeFiles && _fs().default.existsSync(filePath)) {
          const contents = await readFile(filePath, 'utf8');
          (0, _assert().default)(contents, 'Entitlements plist is empty');
          modResults = _plist().default.parse(contents);
        } else {
          modResults = getEntitlementsPlistTemplate();
        }
      } catch (error) {
        // Throw errors in introspection mode.
        if (!config.modRequest.introspect) {
          throw error;
        }
        // Fallback to using the template file.
        modResults = getEntitlementsPlistTemplate();
      }

      // Apply all of the .entitlements values to the `expo.ios.entitlements` or
      // `expo.macos.entitlements` object
      // TODO: Remove this in favor of just overwriting the .entitlements with the Expo object. This will enable people to actually remove values.
      if (!config[applePlatform]) config[applePlatform] = {};
      if (!config[applePlatform].entitlements) config[applePlatform].entitlements = {};
      config[applePlatform].entitlements = {
        ...(modResults || {}),
        ...config[applePlatform].entitlements
      };
      return config[applePlatform].entitlements;
    },
    async write(filePath, config) {
      // Update the contents of the static entitlements object
      if (!config[applePlatform]) {
        config[applePlatform] = {};
      }
      config[applePlatform].entitlements = config.modResults;

      // Return early without writing, in introspection mode.
      if (config.modRequest.introspect) {
        return;
      }
      await writeFile(filePath, _plist().default.build((0, _sortObject().sortObject)(config.modResults)));
    }
  }),
  podfile: (0, _createBaseMod().provider)({
    getFilePath({
      modRequest: {
        projectRoot
      }
    }) {
      return _apple().Paths.getPodfilePath(applePlatform)(projectRoot);
    },
    // @ts-expect-error
    async read(filePath) {
      // Note(cedric): this file is ruby, which is a 1-value subset of AppleLanguage and fails the type check
      return _apple().Paths.getFileInfo(filePath);
    },
    async write(filePath, {
      modResults: {
        contents
      }
    }) {
      await writeFile(filePath, contents);
    }
  }),
  // Append a rule to supply Podfile.properties.json data to mods on
  // `mods.ios.podfileProperties` or `mods.macos.podfileProperties`
  podfileProperties: (0, _createBaseMod().provider)({
    isIntrospective: true,
    getFilePath({
      modRequest: {
        platformProjectRoot
      }
    }) {
      return _path().default.resolve(platformProjectRoot, 'Podfile.properties.json');
    },
    async read(filePath) {
      let results = {};
      try {
        results = await _jsonFile().default.readAsync(filePath);
      } catch {}
      return results;
    },
    async write(filePath, {
      modResults,
      modRequest: {
        introspect
      }
    }) {
      if (introspect) {
        return;
      }
      await _jsonFile().default.writeAsync(filePath, modResults);
    }
  })
});
const withAppleBaseMods = applePlatform => (config, {
  providers,
  ...props
} = {}) => {
  return (0, _createBaseMod().withGeneratedBaseMods)(config, {
    ...props,
    platform: applePlatform,
    providers: providers ?? getAppleModFileProviders(applePlatform)
  });
};

/**
 * A lazy-initialized record of defaultProviders values by platform. Allows us
 * to return the same defaultProviders value for the platform each time.
 */
exports.withAppleBaseMods = withAppleBaseMods;
const lazyDefaultProvidersByPlatform = {};
const getAppleModFileProviders = applePlatform => {
  // Lazy-initialize (and thereafter reuse) the defaultProviders value for each
  // applePlatform.
  let defaultProvidersForPlatform = lazyDefaultProvidersByPlatform[applePlatform];
  if (!defaultProvidersForPlatform) {
    defaultProvidersForPlatform = defaultProviders(applePlatform);
    lazyDefaultProvidersByPlatform[applePlatform] = defaultProvidersForPlatform;
  }
  return defaultProvidersForPlatform;
};
exports.getAppleModFileProviders = getAppleModFileProviders;
//# sourceMappingURL=withAppleBaseMods.js.map