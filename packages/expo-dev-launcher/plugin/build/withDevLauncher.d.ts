import { type ConfigPlugin } from 'expo/config-plugins';
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
declare const _default: ConfigPlugin<PluginConfigType>;
export default _default;
