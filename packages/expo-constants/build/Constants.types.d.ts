import type { ExpoConfig } from 'expo/config';
import type { EASConfig as ManifestsEASConfig, ExpoGoConfig as ManifestsExpoGoConfig, ExpoUpdatesManifest, EmbeddedManifest, ManifestAsset as ManifestAssetForReExport, ManifestExtra as ManifestExtraForReExport, ClientScopingConfig as ClientScopingConfigForReExport, ExpoGoPackagerOpts as ExpoGoPackagerOptsForReExport } from 'expo-manifests';
export declare enum AppOwnership {
    /**
     * The experience is running inside the Expo Go app.
     * @deprecated Use [`Constants.executionEnvironment`](#executionenvironment) instead.
     */
    Expo = "expo"
}
export declare enum ExecutionEnvironment {
    Bare = "bare",
    Standalone = "standalone",
    StoreClient = "storeClient"
}
/**
 * Current supported values are `handset`, `tablet`, `desktop` and `tv`. CarPlay will show up
 * as `unsupported`.
 */
export declare enum UserInterfaceIdiom {
    Handset = "handset",
    Tablet = "tablet",
    Desktop = "desktop",
    TV = "tv",
    Unsupported = "unsupported"
}
/**
 * @platform ios
 */
export type IOSManifest = {
    /**
     * The build number specified in the embedded **Info.plist** value for `CFBundleVersion` in this app.
     * In a standalone app, you can set this with the `ios.buildNumber` value in **app.json**. This
     * may differ from the value in `Constants.expoConfig.ios.buildNumber` because the manifest
     * can be updated, whereas this value will never change for a given native binary.
     * The value is set to `null` in case you run your app in Expo Go.
     */
    buildNumber: string | null;
    /**
     * The Apple internal model identifier for this device.
     * @example
     * `iPhone1,1`
     * @deprecated Use `expo-device`'s [`Device.modelId`](./device/#devicemodelid).
     */
    platform: string;
    /**
     * The human-readable model name of this device. For example, `"iPhone 7 Plus"` if it can be determined,
     * otherwise will be `null`.
     * @deprecated Moved to `expo-device` as [`Device.modelName`](./device/#devicemodelname).
     */
    model: string | null;
    /**
     * The user interface idiom of the current device, such as whether the app is running on an iPhone, iPad, Mac or Apple TV.
     * @deprecated Use `expo-device`'s [`Device.getDeviceTypeAsync()`](./device/#devicegetdevicetypeasync).
     */
    userInterfaceIdiom: UserInterfaceIdiom;
    /**
     * The version of iOS running on this device.
     * @example
     * `10.3`
     * @deprecated Use `expo-device`'s [`Device.osVersion`](./device/#deviceosversion).
     */
    systemVersion: string;
} & Record<string, any>;
/**
 * @platform android
 */
export type AndroidManifest = {
    /**
     * The version code set by `android.versionCode` in app.json.
     * The value is set to `null` in case you run your app in Expo Go.
     * @deprecated Use `expo-application`'s [`Application.nativeBuildVersion`](./application/#applicationnativebuildversion).
     */
    versionCode: number;
} & Record<string, any>;
/**
 * @platform web
 */
export type WebManifest = Record<string, any>;
export type ManifestAsset = ManifestAssetForReExport;
export type Manifest = ExpoUpdatesManifest;
export type ManifestExtra = ManifestExtraForReExport;
export type EASConfig = ManifestsEASConfig;
export type ClientScopingConfig = ClientScopingConfigForReExport;
export type ExpoGoConfig = ManifestsExpoGoConfig;
export type ExpoGoPackagerOpts = ExpoGoPackagerOptsForReExport;
export type PlatformManifest = {
    ios?: IOSManifest;
    android?: AndroidManifest;
    web?: WebManifest;
    detach?: {
        scheme?: string;
        [key: string]: any;
    };
    scheme?: string;
    hostUri?: string;
    developer?: string;
} & Record<string, any>;
export type NativeConstants = {
    /**
     * @hidden
     */
    name: 'ExponentConstants';
    /**
     * Returns `expo` when running in Expo Go, otherwise `null`.
     * @deprecated Use [`Constants.executionEnvironment`](#executionenvironment) instead.
     */
    appOwnership: AppOwnership | null;
    /**
     * Returns `true` when the app is running in debug mode (`__DEV__`). Otherwise, returns `false`.
     */
    debugMode: boolean;
    /**
     * A human-readable name for the device type.
     */
    deviceName?: string;
    /**
     * The [device year class](https://github.com/facebook/device-year-class) of this device.
     * @deprecated Moved to `expo-device` as [`Device.deviceYearClass`](./device/#deviceyearclass).
     */
    deviceYearClass: number | null;
    /**
     * Returns the current execution environment.
     */
    executionEnvironment: ExecutionEnvironment;
    experienceUrl: string;
    /**
     * Nullable only on the web.
     */
    expoRuntimeVersion: string | null;
    /**
     * The version string of the Expo Go app currently running.
     * Returns `null` in bare workflow and web.
     */
    expoVersion: string | null;
    isDetached?: boolean;
    intentUri?: string;
    /**
     * Returns `true` if the app is running in headless mode. Otherwise, returns `false`.
     */
    isHeadless: boolean;
    linkingUri: string;
    /**
     * @hidden
     * Manifest embedded in the build. Returns `null` when `manifest2` is non-null.
     * @deprecated Use `Constants.expoConfig` instead, which behaves more consistently across EAS Build
     * and EAS Update.
     */
    manifest: EmbeddedManifest | null;
    /**
     * Manifest for Expo apps using modern Expo Updates from a remote source, such as apps that
     * use EAS Update. `Constants.expoConfig` should be used for accessing the Expo config object.
     */
    manifest2: ExpoUpdatesManifest | null;
    /**
     * The standard Expo config object defined in **app.json** and **app.config.js** files. For both
     * classic and modern manifests, whether they are embedded or remote.
     */
    expoConfig: (ExpoConfig & {
        /**
         * Only present during development using @expo/cli.
         */
        hostUri?: string;
    }) | null;
    /**
     * The standard Expo Go config object populated when running in Expo Go.
     */
    expoGoConfig: ManifestsExpoGoConfig | null;
    /**
     * The standard EAS config object populated when using EAS.
     */
    easConfig: ManifestsEASConfig | null;
    /**
     * A string that is unique to the current session of your app. It is different across apps and
     * across multiple launches of the same app.
     */
    sessionId: string;
    /**
     * The default status bar height for the device. Does not factor in changes when location tracking
     * is in use or a phone call is active.
     */
    statusBarHeight: number;
    /**
     * A list of the system font names available on the current device.
     */
    systemFonts: string[];
    systemVersion?: number;
    /**
     * @hidden
     */
    supportedExpoSdks?: string[];
    /**
     * Returns the specific platform manifest object.
     *
     * > **Note**: This is distinct from the `manifest` and `manifest2`.
     */
    platform?: PlatformManifest;
    /**
     * Gets the user agent string which would be included in requests sent by a web view running on
     * this device. This is probably not the same user agent you might be providing in your JS `fetch`
     * requests.
     */
    getWebViewUserAgentAsync: () => Promise<string | null>;
} & Record<string, any>;
/**
 * @hidden
 */
export type Constants = NativeConstants & {
    /**
     * > **Warning**: Do not use this property. Use `manifest` by default.
     *
     * In certain cases accessing manifest via this property
     * suppresses important warning about missing manifest.
     */
    __unsafeNoWarnManifest?: EmbeddedManifest;
    /**
     * > **Warning**: Do not use this property. Use `manifest2` by default.
     *
     * In certain cases accessing manifest via this property
     * suppresses important warning about missing manifest.
     */
    __unsafeNoWarnManifest2?: ExpoUpdatesManifest;
};
//# sourceMappingURL=Constants.types.d.ts.map