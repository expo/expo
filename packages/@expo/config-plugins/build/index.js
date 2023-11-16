"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMods = exports.PluginError = exports.evalModsAsync = exports.withDefaultBaseMods = exports.compileModsAsync = exports.withStaticPlugin = exports.withGradleProperties = exports.withSettingsGradle = exports.withAppBuildGradle = exports.withProjectBuildGradle = exports.withMainApplication = exports.withMainActivity = exports.withAndroidStyles = exports.withAndroidColorsNight = exports.withAndroidColors = exports.withStringsXml = exports.withAndroidManifest = exports.withPodfileProperties = exports.withXcodeProject = exports.withExpoPlist = exports.withEntitlementsPlist = exports.withInfoPlist = exports.withAppDelegate = exports.withBaseMod = exports.withMod = exports.withDangerousMod = exports.createRunOncePlugin = exports.withRunOnce = exports.withPlugins = exports.XML = exports.History = exports.WarningAggregator = exports.AndroidConfig = exports.IOSConfig = exports.Updates = void 0;
/**
 * For internal use in Expo CLI
 */
const AndroidConfig = __importStar(require("./android"));
exports.AndroidConfig = AndroidConfig;
const IOSConfig = __importStar(require("./ios"));
exports.IOSConfig = IOSConfig;
const createBaseMod_1 = require("./plugins/createBaseMod");
const withAndroidBaseMods_1 = require("./plugins/withAndroidBaseMods");
const withIosBaseMods_1 = require("./plugins/withIosBaseMods");
const XML = __importStar(require("./utils/XML"));
exports.XML = XML;
const History = __importStar(require("./utils/history"));
exports.History = History;
const WarningAggregator = __importStar(require("./utils/warnings"));
exports.WarningAggregator = WarningAggregator;
// TODO: Remove
exports.Updates = __importStar(require("./utils/Updates"));
/**
 * These are the "config-plugins"
 */
__exportStar(require("./Plugin.types"), exports);
var withPlugins_1 = require("./plugins/withPlugins");
Object.defineProperty(exports, "withPlugins", { enumerable: true, get: function () { return withPlugins_1.withPlugins; } });
var withRunOnce_1 = require("./plugins/withRunOnce");
Object.defineProperty(exports, "withRunOnce", { enumerable: true, get: function () { return withRunOnce_1.withRunOnce; } });
Object.defineProperty(exports, "createRunOncePlugin", { enumerable: true, get: function () { return withRunOnce_1.createRunOncePlugin; } });
var withDangerousMod_1 = require("./plugins/withDangerousMod");
Object.defineProperty(exports, "withDangerousMod", { enumerable: true, get: function () { return withDangerousMod_1.withDangerousMod; } });
var withMod_1 = require("./plugins/withMod");
Object.defineProperty(exports, "withMod", { enumerable: true, get: function () { return withMod_1.withMod; } });
Object.defineProperty(exports, "withBaseMod", { enumerable: true, get: function () { return withMod_1.withBaseMod; } });
var ios_plugins_1 = require("./plugins/ios-plugins");
Object.defineProperty(exports, "withAppDelegate", { enumerable: true, get: function () { return ios_plugins_1.withAppDelegate; } });
Object.defineProperty(exports, "withInfoPlist", { enumerable: true, get: function () { return ios_plugins_1.withInfoPlist; } });
Object.defineProperty(exports, "withEntitlementsPlist", { enumerable: true, get: function () { return ios_plugins_1.withEntitlementsPlist; } });
Object.defineProperty(exports, "withExpoPlist", { enumerable: true, get: function () { return ios_plugins_1.withExpoPlist; } });
Object.defineProperty(exports, "withXcodeProject", { enumerable: true, get: function () { return ios_plugins_1.withXcodeProject; } });
Object.defineProperty(exports, "withPodfileProperties", { enumerable: true, get: function () { return ios_plugins_1.withPodfileProperties; } });
var android_plugins_1 = require("./plugins/android-plugins");
Object.defineProperty(exports, "withAndroidManifest", { enumerable: true, get: function () { return android_plugins_1.withAndroidManifest; } });
Object.defineProperty(exports, "withStringsXml", { enumerable: true, get: function () { return android_plugins_1.withStringsXml; } });
Object.defineProperty(exports, "withAndroidColors", { enumerable: true, get: function () { return android_plugins_1.withAndroidColors; } });
Object.defineProperty(exports, "withAndroidColorsNight", { enumerable: true, get: function () { return android_plugins_1.withAndroidColorsNight; } });
Object.defineProperty(exports, "withAndroidStyles", { enumerable: true, get: function () { return android_plugins_1.withAndroidStyles; } });
Object.defineProperty(exports, "withMainActivity", { enumerable: true, get: function () { return android_plugins_1.withMainActivity; } });
Object.defineProperty(exports, "withMainApplication", { enumerable: true, get: function () { return android_plugins_1.withMainApplication; } });
Object.defineProperty(exports, "withProjectBuildGradle", { enumerable: true, get: function () { return android_plugins_1.withProjectBuildGradle; } });
Object.defineProperty(exports, "withAppBuildGradle", { enumerable: true, get: function () { return android_plugins_1.withAppBuildGradle; } });
Object.defineProperty(exports, "withSettingsGradle", { enumerable: true, get: function () { return android_plugins_1.withSettingsGradle; } });
Object.defineProperty(exports, "withGradleProperties", { enumerable: true, get: function () { return android_plugins_1.withGradleProperties; } });
var withStaticPlugin_1 = require("./plugins/withStaticPlugin");
Object.defineProperty(exports, "withStaticPlugin", { enumerable: true, get: function () { return withStaticPlugin_1.withStaticPlugin; } });
var mod_compiler_1 = require("./plugins/mod-compiler");
Object.defineProperty(exports, "compileModsAsync", { enumerable: true, get: function () { return mod_compiler_1.compileModsAsync; } });
Object.defineProperty(exports, "withDefaultBaseMods", { enumerable: true, get: function () { return mod_compiler_1.withDefaultBaseMods; } });
Object.defineProperty(exports, "evalModsAsync", { enumerable: true, get: function () { return mod_compiler_1.evalModsAsync; } });
var errors_1 = require("./utils/errors");
Object.defineProperty(exports, "PluginError", { enumerable: true, get: function () { return errors_1.PluginError; } });
exports.BaseMods = {
    withGeneratedBaseMods: createBaseMod_1.withGeneratedBaseMods,
    provider: createBaseMod_1.provider,
    withAndroidBaseMods: withAndroidBaseMods_1.withAndroidBaseMods,
    getAndroidModFileProviders: withAndroidBaseMods_1.getAndroidModFileProviders,
    withIosBaseMods: withIosBaseMods_1.withIosBaseMods,
    getIosModFileProviders: withIosBaseMods_1.getIosModFileProviders,
};
