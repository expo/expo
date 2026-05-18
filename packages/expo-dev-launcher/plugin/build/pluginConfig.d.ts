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
     * Instead of navigating to launcher screen launch directly into this URL.
     * If `launchMode` is set to `most-recent` then launcher will use the defaultLaunchURL if launching previously opened project fails.
     */
    defaultLaunchURL?: string;
    /**
     * @deprecated use the `launchMode` property instead
     */
    launchModeExperimental?: 'most-recent' | 'launcher';
    /**
     * Whether to show the tools button by default.
     *
     * @default true
     */
    toolsButton?: boolean;
    /**
     * Whether to enable loading an embedded JS bundle from the dev launcher.
     * When enabled and a bundle file is present in the app, a "Load embedded bundle"
     * option appears in the dev launcher UI.
     *
     * @default false
     */
    embeddedBundle?: boolean;
    /**
     * Skip the dev menu onboarding popup on first launch. Useful for E2E tests and CI
     * builds where the onboarding overlay would block automated input.
     *
     * @default false
     */
    skipOnboarding?: boolean;
    /**
     * Automatically open the dev menu when the app launches. Set to `false` to suppress
     * the auto-launch in development builds where the dev menu would interfere (E2E tests,
     * automated UI runs).
     *
     * @default true
     */
    showMenuAtLaunch?: boolean;
};
/**
 * @ignore
 */
export declare function validateConfig<T>(config: T): PluginConfigType;
