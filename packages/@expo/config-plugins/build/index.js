"use strict";

exports.__esModule = true;
var _exportNames = {
  withPlugins: true,
  withRunOnce: true,
  createRunOncePlugin: true,
  withDangerousMod: true,
  withFinalizedMod: true,
  withMod: true,
  withBaseMod: true,
  withAppDelegate: true,
  withInfoPlist: true,
  withEntitlementsPlist: true,
  withExpoPlist: true,
  withXcodeProject: true,
  withPodfile: true,
  withPodfileProperties: true,
  withAndroidManifest: true,
  withStringsXml: true,
  withAndroidColors: true,
  withAndroidColorsNight: true,
  withAndroidStyles: true,
  withMainActivity: true,
  withMainApplication: true,
  withProjectBuildGradle: true,
  withAppBuildGradle: true,
  withSettingsGradle: true,
  withGradleProperties: true,
  isValidAndroidAssetName: true,
  assertValidAndroidAssetName: true,
  withStaticPlugin: true,
  compileModsAsync: true,
  withDefaultBaseMods: true,
  evalModsAsync: true,
  PluginError: true,
  BaseMods: true,
  AndroidConfig: true,
  IOSConfig: true,
  XML: true,
  CodeGenerator: true,
  History: true,
  WarningAggregator: true,
  Updates: true
};
exports.withXcodeProject = exports.withStringsXml = exports.withStaticPlugin = exports.withSettingsGradle = exports.withRunOnce = exports.withProjectBuildGradle = exports.withPodfileProperties = exports.withPodfile = exports.withPlugins = exports.withMod = exports.withMainApplication = exports.withMainActivity = exports.withInfoPlist = exports.withGradleProperties = exports.withFinalizedMod = exports.withExpoPlist = exports.withEntitlementsPlist = exports.withDefaultBaseMods = exports.withDangerousMod = exports.withBaseMod = exports.withAppDelegate = exports.withAppBuildGradle = exports.withAndroidStyles = exports.withAndroidManifest = exports.withAndroidColorsNight = exports.withAndroidColors = exports.isValidAndroidAssetName = exports.evalModsAsync = exports.createRunOncePlugin = exports.compileModsAsync = exports.assertValidAndroidAssetName = exports.XML = exports.WarningAggregator = exports.Updates = exports.PluginError = exports.IOSConfig = exports.History = exports.CodeGenerator = exports.BaseMods = exports.AndroidConfig = void 0;
function AndroidConfig() {
  const data = _interopRequireWildcard(require("./android"));
  AndroidConfig = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "AndroidConfig", {
  enumerable: true,
  get: function () {
    return AndroidConfig();
  }
});
function IOSConfig() {
  const data = _interopRequireWildcard(require("./ios"));
  IOSConfig = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "IOSConfig", {
  enumerable: true,
  get: function () {
    return IOSConfig();
  }
});
function _createBaseMod() {
  const data = require("./plugins/createBaseMod");
  _createBaseMod = function () {
    return data;
  };
  return data;
}
function _withAndroidBaseMods() {
  const data = require("./plugins/withAndroidBaseMods");
  _withAndroidBaseMods = function () {
    return data;
  };
  return data;
}
function _withIosBaseMods() {
  const data = require("./plugins/withIosBaseMods");
  _withIosBaseMods = function () {
    return data;
  };
  return data;
}
function XML() {
  const data = _interopRequireWildcard(require("./utils/XML"));
  XML = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "XML", {
  enumerable: true,
  get: function () {
    return XML();
  }
});
function CodeGenerator() {
  const data = _interopRequireWildcard(require("./utils/generateCode"));
  CodeGenerator = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "CodeGenerator", {
  enumerable: true,
  get: function () {
    return CodeGenerator();
  }
});
function History() {
  const data = _interopRequireWildcard(require("./utils/history"));
  History = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "History", {
  enumerable: true,
  get: function () {
    return History();
  }
});
function WarningAggregator() {
  const data = _interopRequireWildcard(require("./utils/warnings"));
  WarningAggregator = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "WarningAggregator", {
  enumerable: true,
  get: function () {
    return WarningAggregator();
  }
});
function _Updates() {
  const data = _interopRequireWildcard(require("./utils/Updates"));
  _Updates = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "Updates", {
  enumerable: true,
  get: function () {
    return _Updates();
  }
});
var _Plugin = require("./Plugin.types");
Object.keys(_Plugin).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Plugin[key]) return;
  exports[key] = _Plugin[key];
});
function _withPlugins() {
  const data = require("./plugins/withPlugins");
  _withPlugins = function () {
    return data;
  };
  return data;
}
exports.withPlugins = _withPlugins().withPlugins;
function _withRunOnce() {
  const data = require("./plugins/withRunOnce");
  _withRunOnce = function () {
    return data;
  };
  return data;
}
exports.withRunOnce = _withRunOnce().withRunOnce;
exports.createRunOncePlugin = _withRunOnce().createRunOncePlugin;
function _withDangerousMod() {
  const data = require("./plugins/withDangerousMod");
  _withDangerousMod = function () {
    return data;
  };
  return data;
}
exports.withDangerousMod = _withDangerousMod().withDangerousMod;
function _withFinalizedMod() {
  const data = require("./plugins/withFinalizedMod");
  _withFinalizedMod = function () {
    return data;
  };
  return data;
}
exports.withFinalizedMod = _withFinalizedMod().withFinalizedMod;
function _withMod() {
  const data = require("./plugins/withMod");
  _withMod = function () {
    return data;
  };
  return data;
}
exports.withMod = _withMod().withMod;
exports.withBaseMod = _withMod().withBaseMod;
function _iosPlugins() {
  const data = require("./plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
exports.withAppDelegate = _iosPlugins().withAppDelegate;
exports.withInfoPlist = _iosPlugins().withInfoPlist;
exports.withEntitlementsPlist = _iosPlugins().withEntitlementsPlist;
exports.withExpoPlist = _iosPlugins().withExpoPlist;
exports.withXcodeProject = _iosPlugins().withXcodeProject;
exports.withPodfile = _iosPlugins().withPodfile;
exports.withPodfileProperties = _iosPlugins().withPodfileProperties;
function _androidPlugins() {
  const data = require("./plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
exports.withAndroidManifest = _androidPlugins().withAndroidManifest;
exports.withStringsXml = _androidPlugins().withStringsXml;
exports.withAndroidColors = _androidPlugins().withAndroidColors;
exports.withAndroidColorsNight = _androidPlugins().withAndroidColorsNight;
exports.withAndroidStyles = _androidPlugins().withAndroidStyles;
exports.withMainActivity = _androidPlugins().withMainActivity;
exports.withMainApplication = _androidPlugins().withMainApplication;
exports.withProjectBuildGradle = _androidPlugins().withProjectBuildGradle;
exports.withAppBuildGradle = _androidPlugins().withAppBuildGradle;
exports.withSettingsGradle = _androidPlugins().withSettingsGradle;
exports.withGradleProperties = _androidPlugins().withGradleProperties;
function _validations() {
  const data = require("./utils/validations");
  _validations = function () {
    return data;
  };
  return data;
}
exports.isValidAndroidAssetName = _validations().isValidAndroidAssetName;
exports.assertValidAndroidAssetName = _validations().assertValidAndroidAssetName;
function _withStaticPlugin() {
  const data = require("./plugins/withStaticPlugin");
  _withStaticPlugin = function () {
    return data;
  };
  return data;
}
exports.withStaticPlugin = _withStaticPlugin().withStaticPlugin;
function _modCompiler() {
  const data = require("./plugins/mod-compiler");
  _modCompiler = function () {
    return data;
  };
  return data;
}
exports.compileModsAsync = _modCompiler().compileModsAsync;
exports.withDefaultBaseMods = _modCompiler().withDefaultBaseMods;
exports.evalModsAsync = _modCompiler().evalModsAsync;
function _errors() {
  const data = require("./utils/errors");
  _errors = function () {
    return data;
  };
  return data;
}
exports.PluginError = _errors().PluginError;
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * For internal use in Expo CLI
 */

// TODO: Remove

/**
 * These are the "config-plugins"
 */

const BaseMods = exports.BaseMods = {
  withGeneratedBaseMods: _createBaseMod().withGeneratedBaseMods,
  provider: _createBaseMod().provider,
  withAndroidBaseMods: _withAndroidBaseMods().withAndroidBaseMods,
  getAndroidModFileProviders: _withAndroidBaseMods().getAndroidModFileProviders,
  withIosBaseMods: _withIosBaseMods().withIosBaseMods,
  getIosModFileProviders: _withIosBaseMods().getIosModFileProviders
};
//# sourceMappingURL=index.js.map