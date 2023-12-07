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
     * **Experimental:** Determines whether to launch the most recently opened project or navigate to the launcher screen.
     *
     * - `'most-recent'` - Attempt to launch directly into a previously opened project and if unable to connect,
     * fall back to the launcher screen.
     *
     * - `'launcher'` - Opens the launcher screen.
     *
     * @default 'most-recent'
     */
    launchModeExperimental?: 'most-recent' | 'launcher';
};
/**
 * @ignore
 */
export declare function validateConfig<T>(config: T): PluginConfigType;
