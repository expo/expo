import { ConfigPlugin, ExportedConfigWithProps, Mod } from '../Plugin.types';
import { Manifest, Paths, Properties, Resources } from '../android';
type OptionalPromise<T> = T | Promise<T>;
type MutateDataAction<T> = (expo: ExportedConfigWithProps<T>, data: T) => OptionalPromise<T>;
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export declare function createAndroidManifestPlugin(action: MutateDataAction<Manifest.AndroidManifest>, name: string): ConfigPlugin;
export declare function createStringsXmlPlugin(action: MutateDataAction<Resources.ResourceXML>, name: string): ConfigPlugin;
/**
 * Provides the AndroidManifest.xml for modification.
 *
 * @param config
 * @param action
 */
export declare const withAndroidManifest: ConfigPlugin<Mod<Manifest.AndroidManifest>>;
/**
 * Provides the strings.xml for modification.
 *
 * @param config
 * @param action
 */
export declare const withStringsXml: ConfigPlugin<Mod<Resources.ResourceXML>>;
/**
 * Provides the `android/app/src/main/res/values/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
export declare const withAndroidColors: ConfigPlugin<Mod<Resources.ResourceXML>>;
/**
 * Provides the `android/app/src/main/res/values-night/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
export declare const withAndroidColorsNight: ConfigPlugin<Mod<Resources.ResourceXML>>;
/**
 * Provides the `android/app/src/main/res/values/styles.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
export declare const withAndroidStyles: ConfigPlugin<Mod<Resources.ResourceXML>>;
/**
 * Provides the project MainActivity for modification.
 *
 * @param config
 * @param action
 */
export declare const withMainActivity: ConfigPlugin<Mod<Paths.ApplicationProjectFile>>;
/**
 * Provides the project MainApplication for modification.
 *
 * @param config
 * @param action
 */
export declare const withMainApplication: ConfigPlugin<Mod<Paths.ApplicationProjectFile>>;
/**
 * Provides the project /build.gradle for modification.
 *
 * @param config
 * @param action
 */
export declare const withProjectBuildGradle: ConfigPlugin<Mod<Paths.GradleProjectFile>>;
/**
 * Provides the app/build.gradle for modification.
 *
 * @param config
 * @param action
 */
export declare const withAppBuildGradle: ConfigPlugin<Mod<Paths.GradleProjectFile>>;
/**
 * Provides the /settings.gradle for modification.
 *
 * @param config
 * @param action
 */
export declare const withSettingsGradle: ConfigPlugin<Mod<Paths.GradleProjectFile>>;
/**
 * Provides the /gradle.properties for modification.
 *
 * @param config
 * @param action
 */
export declare const withGradleProperties: ConfigPlugin<Mod<Properties.PropertiesItem[]>>;
export {};
