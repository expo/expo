"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceSkips = void 0;
/**
 * Bitmask of values that can be used to skip certain parts of the sourcers when generating a fingerprint.
 */
var SourceSkips;
(function (SourceSkips) {
    /** Skip nothing */
    SourceSkips[SourceSkips["None"] = 0] = "None";
    //#region - ExpoConfig source (e.g., app.json, app.config.js, etc.)
    /** Versions in app.json, including Android versionCode and iOS buildNumber */
    SourceSkips[SourceSkips["ExpoConfigVersions"] = 1] = "ExpoConfigVersions";
    /** runtimeVersion in app.json if it is a string */
    SourceSkips[SourceSkips["ExpoConfigRuntimeVersionIfString"] = 2] = "ExpoConfigRuntimeVersionIfString";
    /** App names in app.json, including shortName and description */
    SourceSkips[SourceSkips["ExpoConfigNames"] = 4] = "ExpoConfigNames";
    /** Android package name in app.json */
    SourceSkips[SourceSkips["ExpoConfigAndroidPackage"] = 8] = "ExpoConfigAndroidPackage";
    /** iOS bundle identifier in app.json */
    SourceSkips[SourceSkips["ExpoConfigIosBundleIdentifier"] = 16] = "ExpoConfigIosBundleIdentifier";
    /** Schemes in app.json */
    SourceSkips[SourceSkips["ExpoConfigSchemes"] = 32] = "ExpoConfigSchemes";
    /** EAS project information in app.json */
    SourceSkips[SourceSkips["ExpoConfigEASProject"] = 64] = "ExpoConfigEASProject";
    /** Assets in app.json, including icons and splash assets */
    SourceSkips[SourceSkips["ExpoConfigAssets"] = 128] = "ExpoConfigAssets";
    /**
     * Skip the whole ExpoConfig.
     * Please the other ExpoConfig source skips when possible and use this flag with caution.
     * This will potentially skip some native changes.
     * E.g., add a new config plugin, change app icon, or change the app name.
     */
    SourceSkips[SourceSkips["ExpoConfigAll"] = 256] = "ExpoConfigAll";
    //#endregion - ExpoConfig source (e.g., app.json, app.config.js, etc.)
    /**
     * package.json scripts if android and ios items do not contain "run".
     * Because prebuild will change the scripts in package.json,
     * this is useful to generate a consistent fingerprint before and after prebuild.
     */
    SourceSkips[SourceSkips["PackageJsonAndroidAndIosScriptsIfNotContainRun"] = 512] = "PackageJsonAndroidAndIosScriptsIfNotContainRun";
    /**
     * Skip the whole `scripts` section in the project's package.json.
     */
    SourceSkips[SourceSkips["PackageJsonScriptsAll"] = 1024] = "PackageJsonScriptsAll";
})(SourceSkips || (exports.SourceSkips = SourceSkips = {}));
//# sourceMappingURL=SourceSkips.js.map