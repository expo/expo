import { AndroidConfig, type ConfigPlugin } from 'expo/config-plugins';
import { PluginConfigType } from './pluginConfig';
/**
 * Resolves the development server URL to bake into the build for the given platform.
 *
 * Precedence (highest first):
 * 1. `EXPO_DEV_LAUNCHER_DEFAULT_SERVER_URL` env var (build-time override)
 * 2. platform-specific `ios.defaultServerUrl` / `android.defaultServerUrl`
 * 3. top-level `defaultServerUrl`
 *
 * @ignore
 */
export declare function resolveDefaultServerUrl(props: PluginConfigType, platform: 'ios' | 'android', env?: NodeJS.ProcessEnv): string | undefined;
/** The Info.plist key / AndroidManifest meta-data name the native launcher reads on startup. */
export declare const DEFAULT_SERVER_URL_KEY = "DEV_CLIENT_DEFAULT_SERVER_URL";
/**
 * Writes the default server URL into the Info.plist so the iOS dev launcher can auto-connect on launch.
 * @ignore
 */
export declare function setDefaultServerUrlInfoPlist<T extends Record<string, any>>(infoPlist: T, url: string): T;
/**
 * Writes the default server URL as main-application meta-data so the Android dev launcher can
 * auto-connect on launch. Idempotent — re-applying replaces the existing value rather than duplicating it.
 * @ignore
 */
export declare function setDefaultServerUrlAndroidManifest(androidManifest: AndroidConfig.Manifest.AndroidManifest, url: string): AndroidConfig.Manifest.AndroidManifest;
declare const _default: ConfigPlugin<PluginConfigType>;
export default _default;
