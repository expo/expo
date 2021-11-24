import { ExpoConfig } from '@expo/config-types';
export declare enum AppOwnership {
    /**
     * It is a [standalone app](../../../distribution/building-standalone-apps#building-standalone-apps).
     */
    Standalone = "standalone",
    /**
     * The experience is running inside of the Expo Go app.
     */
    Expo = "expo",
    /**
     * It has been opened through a link from a standalone app.
     */
    Guest = "guest"
}
export declare enum ExecutionEnvironment {
    Bare = "bare",
    Standalone = "standalone",
    StoreClient = "storeClient"
}
/**
 * Current supported values are `handset` and `tablet`. Apple TV and CarPlay will show up
 * as `unsupported`.
 */
export declare enum UserInterfaceIdiom {
    Handset = "handset",
    Tablet = "tablet",
    Unsupported = "unsupported"
}
export interface IOSManifest {
    /**
     * The build number specified in the embedded **Info.plist** value for `CFBundleVersion` in this app.
     * In a standalone app, you can set this with the `ios.buildNumber` value in **app.json**. This
     * may differ from the value in `Constants.manifest.ios.buildNumber` because the manifest
     * can be updated, whereas this value will never change for a given native binary.
     * The value is set to `null` in case you run your app in Expo Go.
     */
    buildNumber: string | null;
    /**
     * The Apple internal model identifier for this device, e.g. `iPhone1,1`.
     * @deprecated Deprecated. Use `expo-device`'s [`Device.modelId`](../device/#devicemodelid).
     */
    platform: string;
    /**
     * The human-readable model name of this device, e.g. `"iPhone 7 Plus"` if it can be determined,
     * otherwise will be `null`.
     * @deprecated Deprecated. Moved to `expo-device` as [`Device.modelName`](../device/#devicemodelname).
     */
    model: string | null;
    /**
     * The user interface idiom of this device, i.e. whether the app is running on an iPhone or an iPad.
     * @deprecated Deprecated. Use `expo-device`'s [`Device.getDeviceTypeAsync()`](../device/#devicegetdevicetypeasync).
     */
    userInterfaceIdiom: UserInterfaceIdiom;
    /**
     * The version of iOS running on this device, e.g. `10.3`.
     * @deprecated Deprecated. Use `expo-device`'s [`Device.osVersion`](../device/#deviceosversion).
     */
    systemVersion: string;
    [key: string]: any;
}
export interface AndroidManifest {
    /**
     * The version code set by `android.versionCode` in app.json.
     * The value is set to `null` in case you run your app in Expo Go.
     * @deprecated Deprecated. Use `expo-application`'s [`Application.nativeBuildVersion`](../application/#applicationnativebuildversion).
     */
    versionCode: number;
    [key: string]: any;
}
export interface WebManifest {
    [key: string]: any;
}
export interface ManifestAsset {
    url: string;
}
/**
 * A modern manifest.
 */
export declare type Manifest = {
    id: string;
    createdAt: string;
    runtimeVersion: string;
    launchAsset: ManifestAsset;
    assets: ManifestAsset[];
    metadata: object;
    extra?: ManifestExtra;
};
export declare type ManifestExtra = ClientScopingConfig & {
    expoClient?: ExpoClientConfig;
    expoGo?: ExpoGoConfig;
    eas?: EASConfig;
};
export declare type EASConfig = {
    /**
     * The ID for this project if it's using EAS. UUID. This value will not change when a project is
     * transferred between accounts or renamed.
     */
    projectId?: string;
};
export declare type ClientScopingConfig = {
    /**
     * An opaque unique string for scoping client-side data to this project. This value
     * will not change when a project is transferred between accounts or renamed.
     */
    scopeKey?: string;
};
export declare type ExpoGoConfig = {
    mainModuleName?: string;
    debuggerHost?: string;
    logUrl?: string;
    developer?: {
        tool?: string;
        [key: string]: any;
    };
    packagerOpts?: ExpoGoPackagerOpts;
};
export declare type ExpoGoPackagerOpts = {
    hostType?: string;
    dev?: boolean;
    strict?: boolean;
    minify?: boolean;
    urlType?: string;
    urlRandomness?: string;
    lanType?: string;
    [key: string]: any;
};
export declare type ExpoClientConfig = ExpoConfig & {
    /**
     * Published apps only.
     */
    releaseId?: string;
    revisionId?: string;
    releaseChannel?: string;
    bundleUrl: string;
    hostUri?: string;
    publishedTime?: string;
    /**
     * The Expo account name and slug for this project.
     * @deprecated Prefer `projectId` or `originalFullName` instead for identification and
     * `scopeKey` for scoping due to immutability.
     */
    id?: string;
    /**
     * The original Expo account name and slug for this project. Formatted like `@username/slug`.
     * When unauthenticated, the username is `@anonymous`. For published projects, this value
     * will not change when a project is transferred between accounts or renamed.
     */
    originalFullName?: string;
    /**
     * The Expo account name and slug used for display purposes. Formatted like `@username/slug`.
     * When unauthenticated, the username is `@anonymous`. For published projects, this value
     * may change when a project is transferred between accounts or renamed.
     */
    currentFullName?: string;
};
/**
 * @hidden
 * A classic manifest https://docs.expo.io/guides/how-expo-works/#expo-manifest
 */
export declare type AppManifest = ExpoClientConfig & ExpoGoConfig & EASConfig & ClientScopingConfig & {
    [key: string]: any;
};
export interface PlatformManifest {
    ios?: IOSManifest;
    android?: AndroidManifest;
    web?: WebManifest;
    detach?: {
        scheme?: string;
        [key: string]: any;
    };
    logUrl?: string;
    scheme?: string;
    hostUri?: string;
    developer?: string;
    [key: string]: any;
}
/**
 * @hidden
 */
export interface NativeConstants {
    name: 'ExponentConstants';
    /**
     * Returns `expo`, `standalone`, or `guest`. This property only applies to the managed workflow
     * and classic builds; for apps built with EAS Build and in bare workflow, the result is
     * always `null`.
     */
    appOwnership: AppOwnership | null;
    debugMode: boolean;
    /**
     * A human-readable name for the device type.
     */
    deviceName?: string;
    /**
     * The [device year class](https://github.com/facebook/device-year-class) of this device.
     * @deprecated Deprecated. Moved to `expo-device` as [`Device.deviceYearClass`](../device/#deviceyearclass).
     */
    deviceYearClass: number | null;
    executionEnvironment: ExecutionEnvironment;
    experienceUrl: string;
    expoRuntimeVersion: string | null;
    /**
     * The version string of the Expo Go app currently running.
     * Returns `null` in bare workflow and web.
     */
    expoVersion: string | null;
    isDetached?: boolean;
    intentUri?: string;
    /**
     * An identifier that is unique to this particular device and whose lifetime is at least as long
     * as the installation of the app.
     * @deprecated `Constants.installationId` is deprecated in favor of generating your own ID and
     * storing it. This API will be removed in SDK 44.
     */
    installationId: string;
    /**
     * `true` if the app is running on a device, `false` if running in a simulator or emulator.
     * @deprecated Deprecated. Use `expo-device`'s [`Device.isDevice`](../device/#deviceisdevice).
     */
    isDevice: boolean;
    isHeadless: boolean;
    linkingUri: string;
    /**
     * The **Info.plist** value for `CFBundleShortVersionString` on iOS and the version name set
     * by `version` in app.json on Android at the time the native app was built.
     * @deprecated Deprecated. Use `expo-application`'s [`Application.nativeApplicationVersion`](../application/#applicationnativeapplicationversion).
     */
    nativeAppVersion: string | null;
    /**
     * The **Info.plist** value for `CFBundleVersion` on iOS (set with `ios.buildNumber` value in
     * **app.json** in a standalone app) and the version code set by `android.versionCode` in
     * **app.json** on Android at the time the native app was built.
     * @deprecated Deprecated. Use `expo-application`'s [`Application.nativeBuildVersion`](../application/#applicationnativebuildversion).
     */
    nativeBuildVersion: string | null;
    /**
     * Classic manifest for Expo apps using classic updates.
     * Returns `null` in bare workflow and when `manifest2` is non-null.
     */
    manifest: AppManifest | null;
    /**
     * New manifest for Expo apps using modern Expo Updates.
     * Returns `null` in bare workflow and when `manifest` is non-null.
     */
    manifest2: Manifest | null;
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
    platform?: PlatformManifest;
    /**
     * Gets the user agent string which would be included in requests sent by a web view running on
     * this device. This is probably not the same user agent you might be providing in your JS `fetch`
     * requests.
     */
    getWebViewUserAgentAsync: () => Promise<string | null>;
    [key: string]: any;
}
export interface Constants extends NativeConstants {
    /**
     * @hidden
     * @warning do not use this property. Use `manifest` by default.
     *
     * In certain cases accessing manifest via this property
     * suppresses important warning about missing manifest.
     */
    __unsafeNoWarnManifest?: AppManifest;
    /**
     * @hidden
     * @warning do not use this property. Use `manifest2` by default.
     *
     * In certain cases accessing manifest via this property
     * suppresses important warning about missing manifest.
     */
    __unsafeNoWarnManifest2?: Manifest;
}
