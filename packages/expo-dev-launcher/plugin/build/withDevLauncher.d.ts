import { type ConfigPlugin } from 'expo/config-plugins';
import { PluginConfigType } from './pluginConfig';
/**
 * Resolves the dev launcher's `defaultLaunchURL` for the given platform.
 *
 * Precedence (highest first):
 * 1. `EXPO_DEV_LAUNCHER_DEFAULT_LAUNCH_URL` env var — a build-time override, useful for headless/CI
 *    or multi-server build scripts that set the URL per build invocation rather than in app config.
 * 2. platform-specific `android.defaultLaunchURL` / `ios.defaultLaunchURL`
 * 3. top-level `defaultLaunchURL`
 *
 * @ignore
 */
export declare function resolveDefaultLaunchURL(props: PluginConfigType, platform: 'ios' | 'android', env?: NodeJS.ProcessEnv): string | undefined;
declare const _default: ConfigPlugin<PluginConfigType>;
export default _default;
