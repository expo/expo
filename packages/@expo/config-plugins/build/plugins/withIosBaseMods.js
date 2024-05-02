"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIosModFileProviders = getIosModFileProviders;
exports.withIosBaseMods = withIosBaseMods;
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
function _ios() {
  const data = require("../ios");
  _ios = function () {
    return data;
  };
  return data;
}
function _Entitlements() {
  const data = require("../ios/Entitlements");
  _Entitlements = function () {
    return data;
  };
  return data;
}
function _Xcodeproj() {
  const data = require("../ios/utils/Xcodeproj");
  _Xcodeproj = function () {
    return data;
  };
  return data;
}
function _getInfoPlistPath() {
  const data = require("../ios/utils/getInfoPlistPath");
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
const defaultProviders = {
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
      return _ios().Paths.getAppDelegateFilePath(projectRoot);
    },
    async read(filePath) {
      return _ios().Paths.getFileInfo(filePath);
    },
    async write(filePath, {
      modResults: {
        contents
      }
    }) {
      await writeFile(filePath, contents);
    }
  }),
  // Append a rule to supply Expo.plist data to mods on `mods.ios.expoPlist`
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
  // Append a rule to supply .xcodeproj data to mods on `mods.ios.xcodeproj`
  xcodeproj: (0, _createBaseMod().provider)({
    getFilePath({
      modRequest: {
        projectRoot
      }
    }) {
      return _ios().Paths.getPBXProjectPath(projectRoot);
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
  // Append a rule to supply Info.plist data to mods on `mods.ios.infoPlist`
  infoPlist: (0, _createBaseMod().provider)({
    isIntrospective: true,
    async getFilePath(config) {
      let project = null;
      try {
        project = (0, _Xcodeproj().getPbxproj)(config.modRequest.projectRoot);
      } catch {
        // noop
      }

      // Only check / warn if a project actually exists, this'll provide
      // more accurate warning messages for users in managed projects.
      if (project) {
        const infoPlistBuildProperty = (0, _getInfoPlistPath().getInfoPlistPathFromPbxproj)(project);
        if (infoPlistBuildProperty) {
          //: [root]/myapp/ios/MyApp/Info.plist
          const infoPlistPath = _path().default.join(
          //: myapp/ios
          config.modRequest.platformProjectRoot,
          //: MyApp/Info.plist
          infoPlistBuildProperty);
          if ((0, _modules().fileExists)(infoPlistPath)) {
            return infoPlistPath;
          }
          (0, _warnings().addWarningIOS)('mods.ios.infoPlist', `Info.plist file linked to Xcode project does not exist: ${infoPlistPath}`);
        } else {
          (0, _warnings().addWarningIOS)('mods.ios.infoPlist', 'Failed to find Info.plist linked to Xcode project.');
        }
      }
      try {
        // Fallback on glob...
        return await _ios().Paths.getInfoPlistPath(config.modRequest.projectRoot);
      } catch (error) {
        if (config.modRequest.introspect) {
          // fallback to an empty string in introspection mode.
          return '';
        }
        throw error;
      }
    },
    async read(filePath, config) {
      // Apply all of the Info.plist values to the expo.ios.infoPlist object
      // TODO: Remove this in favor of just overwriting the Info.plist with the Expo object. This will enable people to actually remove values.
      if (!config.ios) config.ios = {};
      if (!config.ios.infoPlist) config.ios.infoPlist = {};
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
      config.ios.infoPlist = {
        ...(modResults || {}),
        ...config.ios.infoPlist
      };
      return config.ios.infoPlist;
    },
    async write(filePath, config) {
      // Update the contents of the static infoPlist object
      if (!config.ios) {
        config.ios = {};
      }
      config.ios.infoPlist = config.modResults;

      // Return early without writing, in introspection mode.
      if (config.modRequest.introspect) {
        return;
      }
      await writeFile(filePath, _plist().default.build((0, _sortObject().sortObject)(config.modResults)));
    }
  }),
  // Append a rule to supply .entitlements data to mods on `mods.ios.entitlements`
  entitlements: (0, _createBaseMod().provider)({
    isIntrospective: true,
    async getFilePath(config) {
      try {
        (0, _Entitlements().ensureApplicationTargetEntitlementsFileConfigured)(config.modRequest.projectRoot);
        return _ios().Entitlements.getEntitlementsPath(config.modRequest.projectRoot) ?? '';
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

      // Apply all of the .entitlements values to the expo.ios.entitlements object
      // TODO: Remove this in favor of just overwriting the .entitlements with the Expo object. This will enable people to actually remove values.
      if (!config.ios) config.ios = {};
      if (!config.ios.entitlements) config.ios.entitlements = {};
      config.ios.entitlements = {
        ...(modResults || {}),
        ...config.ios.entitlements
      };
      return config.ios.entitlements;
    },
    async write(filePath, config) {
      // Update the contents of the static entitlements object
      if (!config.ios) {
        config.ios = {};
      }
      config.ios.entitlements = config.modResults;

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
      return _ios().Paths.getPodfilePath(projectRoot);
    },
    // @ts-expect-error
    async read(filePath) {
      // Note(cedric): this file is ruby, which is a 1-value subset of AppleLanguage and fails the type check
      return _ios().Paths.getFileInfo(filePath);
    },
    async write(filePath, {
      modResults: {
        contents
      }
    }) {
      await writeFile(filePath, contents);
    }
  }),
  // Append a rule to supply Podfile.properties.json data to mods on `mods.ios.podfileProperties`
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
};
function withIosBaseMods(config, {
  providers,
  ...props
} = {}) {
  return (0, _createBaseMod().withGeneratedBaseMods)(config, {
    ...props,
    platform: 'ios',
    providers: providers ?? getIosModFileProviders()
  });
}
function getIosModFileProviders() {
  return defaultProviders;
}
//# sourceMappingURL=withIosBaseMods.js.map