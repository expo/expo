/**
 * For internal use in Expo CLI
 */
import * as AndroidConfig from './android';
import * as IOSConfig from './ios';
import { provider, withGeneratedBaseMods } from './plugins/createBaseMod';
import { getAndroidModFileProviders, withAndroidBaseMods } from './plugins/withAndroidBaseMods';
import { getIosModFileProviders, withIosBaseMods } from './plugins/withIosBaseMods';
import * as XML from './utils/XML';
import * as CodeGenerator from './utils/generateCode';
import * as History from './utils/history';
import * as WarningAggregator from './utils/warnings';
export * as Updates from './utils/Updates';
export { IOSConfig, AndroidConfig };
export { WarningAggregator, CodeGenerator, History, XML };
/**
 * These are the "config-plugins"
 */
export * from './Plugin.types';
export { withPlugins } from './plugins/withPlugins';
export { withRunOnce, createRunOncePlugin } from './plugins/withRunOnce';
export { withDangerousMod } from './plugins/withDangerousMod';
export { withFinalizedMod } from './plugins/withFinalizedMod';
export { withMod, withBaseMod } from './plugins/withMod';
export { withAppDelegate, withInfoPlist, withEntitlementsPlist, withExpoPlist, withXcodeProject, withPodfile, withPodfileProperties, } from './plugins/ios-plugins';
export { withAndroidManifest, withStringsXml, withAndroidColors, withAndroidColorsNight, withAndroidStyles, withMainActivity, withMainApplication, withProjectBuildGradle, withAppBuildGradle, withSettingsGradle, withGradleProperties, } from './plugins/android-plugins';
export { withStaticPlugin } from './plugins/withStaticPlugin';
export { compileModsAsync, withDefaultBaseMods, evalModsAsync } from './plugins/mod-compiler';
export { PluginError } from './utils/errors';
export declare const BaseMods: {
    withGeneratedBaseMods: typeof withGeneratedBaseMods;
    provider: typeof provider;
    withAndroidBaseMods: typeof withAndroidBaseMods;
    getAndroidModFileProviders: typeof getAndroidModFileProviders;
    withIosBaseMods: typeof withIosBaseMods;
    getIosModFileProviders: typeof getIosModFileProviders;
};
