import { ExpoConfig } from '@expo/config-types';
import { JSONObject } from '@expo/json-file';
import { XcodeProject } from 'xcode';
import { Properties } from './android';
import { AndroidManifest } from './android/Manifest';
import * as AndroidPaths from './android/Paths';
import { ResourceXML } from './android/Resources';
import { ExpoPlist, InfoPlist } from './ios/IosConfig.types';
import { AppDelegateProjectFile } from './ios/Paths';
type OptionalPromise<T> = Promise<T> | T;
type Plist = JSONObject;
export interface ModProps<T = any> {
    /**
     * Project root directory for the universal app.
     */
    readonly projectRoot: string;
    /**
     * Project root for the specific platform.
     */
    readonly platformProjectRoot: string;
    /**
     * Name of the mod.
     */
    readonly modName: string;
    /**
     * Optional path to a template project root which when defined, should be used to soft-reset the project.
     */
    readonly templateProjectRoot?: string;
    /**
     * Name of the platform used in the mods config.
     */
    readonly platform: ModPlatform;
    /**
     * If the mod is being evaluated in introspection mode.
     * No file system modifications should be made when introspect is `true`.
     */
    readonly introspect: boolean;
    /**
     * [iOS]: The path component used for querying project files.
     *
     * @example projectRoot/ios/[projectName]/
     */
    readonly projectName?: string;
    /**
     * Ignore any of the user's local native files and solely rely on the generated files.
     * This makes prebuild data, like entitlements, more aligned to what users expects.
     * When enabling this, users must be informed and have a way to disable this exclusion.
     */
    readonly ignoreExistingNativeFiles?: boolean;
    nextMod?: Mod<T>;
}
export interface ExportedConfig extends ExpoConfig {
    mods?: ModConfig | null;
}
export interface ExportedConfigWithProps<Data = any> extends ExportedConfig {
    /**
     * The Object representation of a complex file type.
     */
    modResults: Data;
    modRequest: ModProps<Data>;
    /**
     * A frozen representation of the original file contents,
     * this can be used as a reference into the user's original intent.
     *
     * For example, you could infer that the user defined a certain
     * value explicitly and disable any automatic changes.
     */
    readonly modRawConfig: ExpoConfig;
}
/**
 * A helper type to get the properties of a plugin.
 */
export type PluginParameters<T extends ConfigPlugin<any>> = T extends (config: any, props: infer P) => any ? P : never;
export type ConfigPlugin<Props = void> = (config: ExpoConfig, props: Props) => ExpoConfig;
export type StaticPlugin<T = any> = [string | ConfigPlugin<T>, T];
export type Mod<Props = any> = ((config: ExportedConfigWithProps<Props>) => OptionalPromise<ExportedConfigWithProps<Props>>) & {
    /**
     * Indicates that the mod provides data upstream to other mods.
     * This mod should always be the last one added.
     */
    isProvider?: boolean;
    /**
     * If the mod supports introspection, and avoids making any filesystem modifications during compilation.
     * By enabling, this mod, and all of its descendants will be run in introspection mode.
     * This should only be used for static files like JSON or XML, and not for application files that require regexes,
     * or complex static files that require other files to be generated like Xcode `.pbxproj`.
     */
    isIntrospective?: boolean;
    /** Root directory to a template that can be used to soft-reset providers. */
    templateProjectRoot?: boolean;
};
export interface ModConfig {
    android?: {
        /**
         * Dangerously make a modification before any other platform mods have been run.
         */
        dangerous?: Mod<unknown>;
        /**
         * Dangerously make a modification after all the other platform mods have been run.
         */
        finalized?: Mod<unknown>;
        /**
         * Modify the `android/app/src/main/AndroidManifest.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
         */
        manifest?: Mod<AndroidManifest>;
        /**
         * Modify the `android/app/src/main/res/values/strings.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
         */
        strings?: Mod<ResourceXML>;
        /**
         * Modify the `android/app/src/main/res/values/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
         */
        colors?: Mod<ResourceXML>;
        /**
         * Modify the `android/app/src/main/res/values-night/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
         */
        colorsNight?: Mod<ResourceXML>;
        /**
         * Modify the `android/app/src/main/res/values/styles.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
         */
        styles?: Mod<ResourceXML>;
        /**
         * Modify the `android/app/src/main/<package>/MainActivity.java` as a string.
         */
        mainActivity?: Mod<AndroidPaths.ApplicationProjectFile>;
        /**
         * Modify the `android/app/src/main/<package>/MainApplication.java` as a string.
         */
        mainApplication?: Mod<AndroidPaths.ApplicationProjectFile>;
        /**
         * Modify the `android/app/build.gradle` as a string.
         */
        appBuildGradle?: Mod<AndroidPaths.GradleProjectFile>;
        /**
         * Modify the `android/build.gradle` as a string.
         */
        projectBuildGradle?: Mod<AndroidPaths.GradleProjectFile>;
        /**
         * Modify the `android/settings.gradle` as a string.
         */
        settingsGradle?: Mod<AndroidPaths.GradleProjectFile>;
        /**
         * Modify the `android/gradle.properties` as a `Properties.PropertiesItem[]`.
         */
        gradleProperties?: Mod<Properties.PropertiesItem[]>;
    };
    ios?: {
        /**
         * Dangerously make a modification before any other platform mods have been run.
         */
        dangerous?: Mod<unknown>;
        /**
         * Dangerously make a modification after all the other platform mods have been run.
         */
        finalized?: Mod<unknown>;
        /**
         * Modify the `ios/<name>/Info.plist` as JSON (parsed with [`@expo/plist`](https://www.npmjs.com/package/@expo/plist)).
         */
        infoPlist?: Mod<InfoPlist>;
        /**
         * Modify the `ios/<name>/<product-name>.entitlements` as JSON (parsed with [`@expo/plist`](https://www.npmjs.com/package/@expo/plist)).
         */
        entitlements?: Mod<Plist>;
        /**
         * Modify the `ios/<name>/Expo.plist` as JSON (Expo updates config for iOS) (parsed with [`@expo/plist`](https://www.npmjs.com/package/@expo/plist)).
         */
        expoPlist?: Mod<Plist>;
        /**
         * Modify the `ios/<name>.xcodeproj` as an `XcodeProject` (parsed with [`xcode`](https://www.npmjs.com/package/xcode))
         */
        xcodeproj?: Mod<XcodeProject>;
        /**
         * Modify the `ios/<name>/AppDelegate.m` as a string (dangerous)
         */
        appDelegate?: Mod<AppDelegateProjectFile>;
        /**
         * Modify the `ios/Podfile.properties.json` as key-value pairs
         */
        podfileProperties?: Mod<Record<string, string>>;
    };
}
export type ModPlatform = keyof ModConfig;
export { XcodeProject, InfoPlist, ExpoPlist, AndroidManifest };
