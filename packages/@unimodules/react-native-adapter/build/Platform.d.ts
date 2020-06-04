export declare type PlatformOSType = 'ios' | 'android' | 'web' | 'native' | 'macos' | 'windows' | 'electron';
export declare type PlatformSelect = <T>(specifics: ({
    [platform in PlatformOSType]?: T;
} & {
    default: T;
}) | {
    [platform in PlatformOSType]: T;
}) => T;
declare const Platform: {
    /**
     * Denotes the currently running platform.
     * Can be one of ios, android, web.
     */
    OS: "ios" | "android" | "windows" | "macos" | "web";
    /**
     * Returns the value with the matching platform.
     * Object keys can be any of ios, android, native, web, default.
     *
     * @ios ios, native, default
     * @android android, native, default
     * @web web, default
     */
    select: PlatformSelect;
    /**
     * Used for delegating node actions when browser APIs aren't available
     * like in SSR websites. DOM is not available in native React runtimes.
     */
    isDOMAvailable: boolean;
};
export default Platform;
