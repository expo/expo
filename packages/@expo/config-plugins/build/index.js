"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  BaseMods: true,
  AndroidConfig: true,
  IOSConfig: true,
  XML: true,
  CodeGenerator: true,
  History: true,
  WarningAggregator: true,
  Updates: true,
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
  PluginError: true
};
exports.IOSConfig = exports.History = exports.CodeGenerator = exports.BaseMods = exports.AndroidConfig = void 0;
Object.defineProperty(exports, "PluginError", {
  enumerable: true,
  get: function () {
    return _errors().PluginError;
  }
});
exports.XML = exports.WarningAggregator = exports.Updates = void 0;
Object.defineProperty(exports, "assertValidAndroidAssetName", {
  enumerable: true,
  get: function () {
    return _validations().assertValidAndroidAssetName;
  }
});
Object.defineProperty(exports, "compileModsAsync", {
  enumerable: true,
  get: function () {
    return _modCompiler().compileModsAsync;
  }
});
Object.defineProperty(exports, "createRunOncePlugin", {
  enumerable: true,
  get: function () {
    return _withRunOnce().createRunOncePlugin;
  }
});
Object.defineProperty(exports, "evalModsAsync", {
  enumerable: true,
  get: function () {
    return _modCompiler().evalModsAsync;
  }
});
Object.defineProperty(exports, "isValidAndroidAssetName", {
  enumerable: true,
  get: function () {
    return _validations().isValidAndroidAssetName;
  }
});
Object.defineProperty(exports, "withAndroidColors", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withAndroidColors;
  }
});
Object.defineProperty(exports, "withAndroidColorsNight", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withAndroidColorsNight;
  }
});
Object.defineProperty(exports, "withAndroidManifest", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withAndroidManifest;
  }
});
Object.defineProperty(exports, "withAndroidStyles", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withAndroidStyles;
  }
});
Object.defineProperty(exports, "withAppBuildGradle", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withAppBuildGradle;
  }
});
Object.defineProperty(exports, "withAppDelegate", {
  enumerable: true,
  get: function () {
    return _iosPlugins().withAppDelegate;
  }
});
Object.defineProperty(exports, "withBaseMod", {
  enumerable: true,
  get: function () {
    return _withMod().withBaseMod;
  }
});
Object.defineProperty(exports, "withDangerousMod", {
  enumerable: true,
  get: function () {
    return _withDangerousMod().withDangerousMod;
  }
});
Object.defineProperty(exports, "withDefaultBaseMods", {
  enumerable: true,
  get: function () {
    return _modCompiler().withDefaultBaseMods;
  }
});
Object.defineProperty(exports, "withEntitlementsPlist", {
  enumerable: true,
  get: function () {
    return _iosPlugins().withEntitlementsPlist;
  }
});
Object.defineProperty(exports, "withExpoPlist", {
  enumerable: true,
  get: function () {
    return _iosPlugins().withExpoPlist;
  }
});
Object.defineProperty(exports, "withFinalizedMod", {
  enumerable: true,
  get: function () {
    return _withFinalizedMod().withFinalizedMod;
  }
});
Object.defineProperty(exports, "withGradleProperties", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withGradleProperties;
  }
});
Object.defineProperty(exports, "withInfoPlist", {
  enumerable: true,
  get: function () {
    return _iosPlugins().withInfoPlist;
  }
});
Object.defineProperty(exports, "withMainActivity", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withMainActivity;
  }
});
Object.defineProperty(exports, "withMainApplication", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withMainApplication;
  }
});
Object.defineProperty(exports, "withMod", {
  enumerable: true,
  get: function () {
    return _withMod().withMod;
  }
});
Object.defineProperty(exports, "withPlugins", {
  enumerable: true,
  get: function () {
    return _withPlugins().withPlugins;
  }
});
Object.defineProperty(exports, "withPodfile", {
  enumerable: true,
  get: function () {
    return _iosPlugins().withPodfile;
  }
});
Object.defineProperty(exports, "withPodfileProperties", {
  enumerable: true,
  get: function () {
    return _iosPlugins().withPodfileProperties;
  }
});
Object.defineProperty(exports, "withProjectBuildGradle", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withProjectBuildGradle;
  }
});
Object.defineProperty(exports, "withRunOnce", {
  enumerable: true,
  get: function () {
    return _withRunOnce().withRunOnce;
  }
});
Object.defineProperty(exports, "withSettingsGradle", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withSettingsGradle;
  }
});
Object.defineProperty(exports, "withStaticPlugin", {
  enumerable: true,
  get: function () {
    return _withStaticPlugin().withStaticPlugin;
  }
});
Object.defineProperty(exports, "withStringsXml", {
  enumerable: true,
  get: function () {
    return _androidPlugins().withStringsXml;
  }
});
Object.defineProperty(exports, "withXcodeProject", {
  enumerable: true,
  get: function () {
    return _iosPlugins().withXcodeProject;
  }
});
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
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Plugin[key];
    }
  });
});
function _withPlugins() {
  const data = require("./plugins/withPlugins");
  _withPlugins = function () {
    return data;
  };
  return data;
}
function _withRunOnce() {
  const data = require("./plugins/withRunOnce");
  _withRunOnce = function () {
    return data;
  };
  return data;
}
function _withDangerousMod() {
  const data = require("./plugins/withDangerousMod");
  _withDangerousMod = function () {
    return data;
  };
  return data;
}
function _withFinalizedMod() {
  const data = require("./plugins/withFinalizedMod");
  _withFinalizedMod = function () {
    return data;
  };
  return data;
}
function _withMod() {
  const data = require("./plugins/withMod");
  _withMod = function () {
    return data;
  };
  return data;
}
function _iosPlugins() {
  const data = require("./plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("./plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
function _validations() {
  const data = require("./utils/validations");
  _validations = function () {
    return data;
  };
  return data;
}
function _withStaticPlugin() {
  const data = require("./plugins/withStaticPlugin");
  _withStaticPlugin = function () {
    return data;
  };
  return data;
}
function _modCompiler() {
  const data = require("./plugins/mod-compiler");
  _modCompiler = function () {
    return data;
  };
  return data;
}
function _errors() {
  const data = require("./utils/errors");
  _errors = function () {
    return data;
  };
  return data;
}
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