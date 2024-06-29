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
     * Determines whether to launch the most recently opened project or navigate to the launcher screen.
     *
     * - `'most-recent'` - Attempt to launch directly into a previously opened project and if unable to connect,
     * fall back to the launcher screen.
     *
     * - `'launcher'` - Opens the launcher screen.
     *
     * @default 'most-recent'
     */
    launchMode?: 'most-recent' | 'launcher';
    /**
     * @deprecated use the `launchMode` property instead
     */
    launchModeExperimental?: 'most-recent' | 'launcher';
    /**
     * Determines whether to add the generated default `exp+slug` URL scheme or not.
     * @default 'true'
     */
    generatedSchemeEnabled?: boolean;
};
/**
 * @ignore
 */
export declare function validateConfig<T>(config: T): PluginConfigType;
