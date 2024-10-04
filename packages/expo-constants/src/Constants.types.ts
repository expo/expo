import { ExpoConfig } from '@expo/config-types';
import type {
  EASConfig as ManifestsEASConfig,
  ExpoGoConfig as ManifestsExpoGoConfig,
  NewManifest,
  BareManifest,
  ManifestAsset as ManifestAssetForReExport,
  ManifestExtra as ManifestExtraForReExport,
  ClientScopingConfig as ClientScopingConfigForReExport,
  ExpoGoPackagerOpts as ExpoGoPackagerOptsForReExport,
  // @ts-ignore -- optional interface, will gracefully degrade to `any` not installed
} from 'expo-manifests';

// @needsAudit
export enum AppOwnership {
  /**
   * It is a [standalone app](/classic/building-standalone-apps#building-standalone-apps).
   */
  Standalone = 'standalone',
  /**
   * The experience is running inside of the Expo Go app.
   */
  Expo = 'expo',
  /**
   * It has been opened through a link from a standalone app.
   */
  Guest = 'guest',
}

// @docsMissing
export enum ExecutionEnvironment {
  Bare = 'bare',
  Standalone = 'standalone',
  StoreClient = 'storeClient',
}

// @needsAudit
/**
 * Current supported values are `handset` and `tablet`. Apple TV and CarPlay will show up
 * as `unsupported`.
 */
export enum UserInterfaceIdiom {
  Handset = 'handset',
  Tablet = 'tablet',
  Unsupported = 'unsupported',
}

// @needsAudit
export interface IOSManifest {
  /**
   * The build number specified in the embedded **Info.plist** value for `CFBundleVersion` in this app.
   * In a standalone app, you can set this with the `ios.buildNumber` value in **app.json**. This
   * may differ from the value in `Constants.expoConfig.ios.buildNumber` because the manifest
   * can be updated, whereas this value will never change for a given native binary.
   * The value is set to `null` in case you run your app in Expo Go.
   */
  buildNumber: string | null;
  /**
   * The Apple internal model identifier for this device, e.g. `iPhone1,1`.
   * @deprecated Use `expo-device`'s [`Device.modelId`](./device/#devicemodelid).
   */
  platform: string;
  /**
   * The human-readable model name of this device, e.g. `"iPhone 7 Plus"` if it can be determined,
   * otherwise will be `null`.
   * @deprecated Moved to `expo-device` as [`Device.modelName`](./device/#devicemodelname).
   */
  model: string | null;
  /**
   * The user interface idiom of this device, i.e. whether the app is running on an iPhone or an iPad.
   * @deprecated Use `expo-device`'s [`Device.getDeviceTypeAsync()`](./device/#devicegetdevicetypeasync).
   */
  userInterfaceIdiom: UserInterfaceIdiom;
  /**
   * The version of iOS running on this device, e.g. `10.3`.
   * @deprecated Use `expo-device`'s [`Device.osVersion`](./device/#deviceosversion).
   */
  systemVersion: string;
  [key: string]: any;
}

// @needsAudit
export interface AndroidManifest {
  /**
   * The version code set by `android.versionCode` in app.json.
   * The value is set to `null` in case you run your app in Expo Go.
   * @deprecated Use `expo-application`'s [`Application.nativeBuildVersion`](./application/#applicationnativebuildversion).
   */
  versionCode: number;
  [key: string]: any;
}

export interface WebManifest {
  [key: string]: any;
}

// type re-exports to prevent breaking change

export type ManifestAsset = ManifestAssetForReExport;
export type Manifest = NewManifest;
export type ManifestExtra = ManifestExtraForReExport;
export type EASConfig = ManifestsEASConfig;
export type ClientScopingConfig = ClientScopingConfigForReExport;
export type ExpoGoConfig = ManifestsExpoGoConfig;
export type ExpoGoPackagerOpts = ExpoGoPackagerOptsForReExport;

// @needsAudit @docsMissing
export interface PlatformManifest {
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
  [key: string]: any;
}

// @needsAudit @docsMissing
export interface NativeConstants {
  /**
   * @hidden
   */
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
   * @deprecated Moved to `expo-device` as [`Device.deviceYearClass`](./device/#deviceyearclass).
   */
  deviceYearClass: number | null;
  executionEnvironment: ExecutionEnvironment;
  experienceUrl: string;
  // only nullable on web
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
   * storing it.
   */
  installationId: string;
  /**
   * `true` if the app is running on a device, `false` if running in a simulator or emulator.
   * @deprecated Use `expo-device`'s [`Device.isDevice`](./device/#deviceisdevice).
   */
  isDevice: boolean;
  isHeadless: boolean;
  linkingUri: string;
  /**
   * The **Info.plist** value for `CFBundleShortVersionString` on iOS and the version name set
   * by `version` in app.json on Android at the time the native app was built.
   * @deprecated Use `expo-application`'s [`Application.nativeApplicationVersion`](./application/#applicationnativeapplicationversion).
   */
  nativeAppVersion: string | null;
  /**
   * The **Info.plist** value for `CFBundleVersion` on iOS (set with `ios.buildNumber` value in
   * **app.json** in a standalone app) and the version code set by `android.versionCode` in
   * **app.json** on Android at the time the native app was built.
   * @deprecated Use `expo-application`'s [`Application.nativeBuildVersion`](./application/#applicationnativebuildversion).
   */
  nativeBuildVersion: string | null;
  /**
   * Classic manifest for Expo apps using classic updates and the updates embedded in builds.
   * Returns `null` in bare workflow and when `manifest2` is non-null.
   * @deprecated Use `Constants.expoConfig` instead, which behaves more consistently across EAS Build
   * and EAS Update.
   */
  manifest: BareManifest | null;
  /**
   * Manifest for Expo apps using modern Expo Updates from a remote source, such as apps that
   * use EAS Update. Returns `null` in bare workflow and when `manifest` is non-null.
   * `Constants.expoConfig` should be used for accessing the Expo config object.
   */
  manifest2: NewManifest | null;
  /**
   * The standard Expo config object defined in `app.json` and `app.config.js` files. For both
   * classic and modern manifests, whether they are embedded or remote.
   */
  expoConfig:
    | (ExpoConfig & {
        /**
         * Only present during development using @expo/cli.
         */
        hostUri?: string;
      })
    | null;
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
  __unsafeNoWarnManifest?: BareManifest;
  /**
   * @hidden
   * @warning do not use this property. Use `manifest2` by default.
   *
   * In certain cases accessing manifest via this property
   * suppresses important warning about missing manifest.
   */
  __unsafeNoWarnManifest2?: NewManifest;
}
