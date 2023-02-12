import { PlatformOSType } from 'react-native';
export type PlatformSelectOSType = PlatformOSType | 'native' | 'electron' | 'default';
export type PlatformSelect = <T>(specifics: {
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
    /**
     * Denotes if the current environment can attach event listeners
     * to the window. This will return false in native React
     * runtimes and Node.js.
     */
    canUseEventListeners: boolean;
    /**
     * Denotes if the current environment can inspect properties of the
     * screen on which the current window is being rendered. This will
     * return false in native React runtimes and Node.js.
     */
    canUseViewport: boolean;
    /**
     * If the JavaScript is being executed in a remote JavaScript environment.
     * When `true`, synchronous native invocations cannot be executed.
     */
    isAsyncDebugging: boolean;
};
export default Platform;
//# sourceMappingURL=Platform.d.ts.map