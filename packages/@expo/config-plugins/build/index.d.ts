/// <reference types="xcode" />
/**
 * For internal use in Expo CLI
 */
import * as AndroidConfig from './android';
import * as AppleConfig from './apple';
import * as IOSConfig from './ios';
import * as MacOSConfig from './macos';
import { provider, withGeneratedBaseMods } from './plugins/createBaseMod';
import { getAndroidModFileProviders, withAndroidBaseMods } from './plugins/withAndroidBaseMods';
import * as XML from './utils/XML';
import * as History from './utils/history';
import * as WarningAggregator from './utils/warnings';
export * as Updates from './utils/Updates';
export { IOSConfig, MacOSConfig, AppleConfig, AndroidConfig };
export { WarningAggregator, History, XML };
/**
 * These are the "config-plugins"
 */
export * from './Plugin.types';
export { withPlugins } from './plugins/withPlugins';
export { withRunOnce, createRunOncePlugin } from './plugins/withRunOnce';
export { withDangerousMod } from './plugins/withDangerousMod';
export { withFinalizedMod } from './plugins/withFinalizedMod';
export { withMod, withBaseMod } from './plugins/withMod';
export { 
/** @deprecated Use `withIosAppDelegate` instead. */
withAppDelegate, 
/** @deprecated Use `withIosInfoPlist` instead. */
withInfoPlist, 
/** @deprecated Use `withIosEntitlementsPlist` instead. */
withEntitlementsPlist, 
/** @deprecated Use `withIosExpoPlist` instead. */
withExpoPlist, 
/** @deprecated Use `withIosXcodeProject` instead. */
withXcodeProject, 
/** @deprecated Use `withIosPodfile` instead. */
withPodfile, 
/** @deprecated Use `withIosPodfileProperties` instead. */
withPodfileProperties, } from './plugins/ios-plugins';
export { withAppDelegate as withIosAppDelegate, withInfoPlist as withIosInfoPlist, withEntitlementsPlist as withIosEntitlementsPlist, withExpoPlist as withIosExpoPlist, withXcodeProject as withIosXcodeProject, withPodfile as withIosPodfile, withPodfileProperties as withIosPodfileProperties, } from './plugins/ios-plugins';
export { withAppDelegate as withMacosAppDelegate, withInfoPlist as withMacosInfoPlist, withEntitlementsPlist as withMacosEntitlementsPlist, withExpoPlist as withMacosExpoPlist, withXcodeProject as withMacosXcodeProject, withPodfile as withMacosPodfile, withPodfileProperties as withMacosPodfileProperties, } from './plugins/macos-plugins';
export { withAndroidManifest, withStringsXml, withAndroidColors, withAndroidColorsNight, withAndroidStyles, withMainActivity, withMainApplication, withProjectBuildGradle, withAppBuildGradle, withSettingsGradle, withGradleProperties, } from './plugins/android-plugins';
export { withStaticPlugin } from './plugins/withStaticPlugin';
export { compileModsAsync, withDefaultBaseMods, evalModsAsync } from './plugins/mod-compiler';
export { PluginError } from './utils/errors';
export declare const BaseMods: {
    withGeneratedBaseMods: typeof withGeneratedBaseMods;
    provider: typeof provider;
    withAndroidBaseMods: typeof withAndroidBaseMods;
    getAndroidModFileProviders: typeof getAndroidModFileProviders;
    withIosBaseMods: (config: import("./Plugin.types").ExportedConfig, { providers, ...props }?: Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">> & {
        providers?: Partial<{
            dangerous: import("./plugins/createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            finalized: import("./plugins/createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            appDelegate: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.Paths.AppDelegateProjectFile, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            expoPlist: import("./plugins/createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            xcodeproj: import("./plugins/createBaseMod").BaseModProviderMethods<import("xcode").XcodeProject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            infoPlist: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.InfoPlist, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            entitlements: import("./plugins/createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            podfile: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.Paths.PodfileProjectFile, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            podfileProperties: import("./plugins/createBaseMod").BaseModProviderMethods<Record<string, import("@expo/json-file").JSONValue>, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        }> | undefined;
    }) => import("./Plugin.types").ExportedConfig;
    getIosModFileProviders: {
        dangerous: import("./plugins/createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        finalized: import("./plugins/createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        appDelegate: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.Paths.AppDelegateProjectFile, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        expoPlist: import("./plugins/createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        xcodeproj: import("./plugins/createBaseMod").BaseModProviderMethods<import("xcode").XcodeProject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        infoPlist: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.InfoPlist, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        entitlements: import("./plugins/createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        podfile: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.Paths.PodfileProjectFile, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        podfileProperties: import("./plugins/createBaseMod").BaseModProviderMethods<Record<string, import("@expo/json-file").JSONValue>, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    };
    withMacosBaseMods: (config: import("./Plugin.types").ExportedConfig, { providers, ...props }?: Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">> & {
        providers?: Partial<{
            dangerous: import("./plugins/createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            finalized: import("./plugins/createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            appDelegate: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.Paths.AppDelegateProjectFile, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            expoPlist: import("./plugins/createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            xcodeproj: import("./plugins/createBaseMod").BaseModProviderMethods<import("xcode").XcodeProject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            infoPlist: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.InfoPlist, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            entitlements: import("./plugins/createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            podfile: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.Paths.PodfileProjectFile, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
            podfileProperties: import("./plugins/createBaseMod").BaseModProviderMethods<Record<string, import("@expo/json-file").JSONValue>, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        }> | undefined;
    }) => import("./Plugin.types").ExportedConfig;
    getMacosModFileProviders: {
        dangerous: import("./plugins/createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        finalized: import("./plugins/createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        appDelegate: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.Paths.AppDelegateProjectFile, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        expoPlist: import("./plugins/createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        xcodeproj: import("./plugins/createBaseMod").BaseModProviderMethods<import("xcode").XcodeProject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        infoPlist: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.InfoPlist, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        entitlements: import("./plugins/createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        podfile: import("./plugins/createBaseMod").BaseModProviderMethods<AppleConfig.Paths.PodfileProjectFile, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        podfileProperties: import("./plugins/createBaseMod").BaseModProviderMethods<Record<string, import("@expo/json-file").JSONValue>, Partial<Pick<import("./plugins/withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    };
};
