/**
 * Type representing base dev launcher configuration.
 */
export type PluginConfigType = PluginConfigOptionsByPlatform & PluginConfigOptions;
/**
 * Type representing available configuration for each platform.
 */
export type PluginConfigOptionsByPlatform = {
    /**
     * Type representing available configuration for Android dev launcher.
     * @platform android
     */
    android?: PluginConfigOptions;
    /**
     * Type representing available configuration for iOS dev launcher.
     * @platform ios
     */
    ios?: PluginConfigOptions;
};
/**
 * Type representing available configuration for dev launcher.
 */
export type PluginConfigOptions = {
    /**
     * Attempts to launch directly into a previously opened project. If unable to connect,
     * fall back to the launcher screen.
     */
    tryToLaunchLastOpenedBundle?: boolean;
};
/**
 * @ignore
 */
export declare function validateConfig<T>(config: T): PluginConfigType;
