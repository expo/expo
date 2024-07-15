/**
 * For internal use in Expo CLI
 */
import * as AndroidConfig from './android';
import * as AppleConfig from './apple';
import * as IOSConfig from './ios';
import * as MacOSConfig from './macos';
import { provider, withGeneratedBaseMods } from './plugins/createBaseMod';
import { getAndroidModFileProviders, withAndroidBaseMods } from './plugins/withAndroidBaseMods';
import { getIosModFileProviders, withIosBaseMods } from './plugins/withIosBaseMods';
import { getMacosModFileProviders, withMacosBaseMods } from './plugins/withMacosBaseMods';
import * as XML from './utils/XML';
import * as History from './utils/history';
import * as WarningAggregator from './utils/warnings';

// TODO: Remove
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
  withPodfileProperties,
} from './plugins/ios-plugins';

export {
  withAppDelegate as withIosAppDelegate,
  withInfoPlist as withIosInfoPlist,
  withEntitlementsPlist as withIosEntitlementsPlist,
  withExpoPlist as withIosExpoPlist,
  withXcodeProject as withIosXcodeProject,
  withPodfile as withIosPodfile,
  withPodfileProperties as withIosPodfileProperties,
} from './plugins/ios-plugins';

export {
  withAppDelegate as withMacosAppDelegate,
  withInfoPlist as withMacosInfoPlist,
  withEntitlementsPlist as withMacosEntitlementsPlist,
  withExpoPlist as withMacosExpoPlist,
  withXcodeProject as withMacosXcodeProject,
  withPodfile as withMacosPodfile,
  withPodfileProperties as withMacosPodfileProperties,
} from './plugins/macos-plugins';

export {
  withAndroidManifest,
  withStringsXml,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
  withMainActivity,
  withMainApplication,
  withProjectBuildGradle,
  withAppBuildGradle,
  withSettingsGradle,
  withGradleProperties,
} from './plugins/android-plugins';

export { withStaticPlugin } from './plugins/withStaticPlugin';

export { compileModsAsync, withDefaultBaseMods, evalModsAsync } from './plugins/mod-compiler';

export { PluginError } from './utils/errors';

export const BaseMods = {
  withGeneratedBaseMods,
  provider,
  withAndroidBaseMods,
  getAndroidModFileProviders,
  withIosBaseMods,
  getIosModFileProviders,
  withMacosBaseMods,
  getMacosModFileProviders,
};
