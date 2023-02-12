/**
 * For internal use in Expo CLI
 */
import * as AndroidConfig from './android';
import * as IOSConfig from './ios';
import { provider, withGeneratedBaseMods } from './plugins/createBaseMod';
import { getAndroidModFileProviders, withAndroidBaseMods } from './plugins/withAndroidBaseMods';
import { getIosModFileProviders, withIosBaseMods } from './plugins/withIosBaseMods';
import * as XML from './utils/XML';
import * as History from './utils/history';
import * as WarningAggregator from './utils/warnings';

// TODO: Remove
export * as Updates from './utils/Updates';

export { IOSConfig, AndroidConfig };

export { WarningAggregator, History, XML };

/**
 * These are the "config-plugins"
 */

export * from './Plugin.types';

export { withPlugins } from './plugins/withPlugins';

export { withRunOnce, createRunOncePlugin } from './plugins/withRunOnce';

export { withDangerousMod } from './plugins/withDangerousMod';
export { withMod, withBaseMod } from './plugins/withMod';

export {
  withAppDelegate,
  withInfoPlist,
  withEntitlementsPlist,
  withExpoPlist,
  withXcodeProject,
  withPodfileProperties,
} from './plugins/ios-plugins';

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
};
