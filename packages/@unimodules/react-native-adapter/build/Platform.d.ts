import { PlatformOSType } from 'react-native';
export declare type PlatformSelectOSType = PlatformOSType | 'native' | 'electron' | 'default';
export declare type PlatformSelect = <T>(specifics: {
    [platform in PlatformSelectOSType]?: T;
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
     * Denotes if the DOM API is available in the current environment.
     * The DOM is not available in native React runtimes and Node.js.
     */
    isDOMAvailable: boolean;
};
export default Platform;
