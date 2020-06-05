import { Platform as ReactNativePlatform } from 'react-native';
import { isDOMAvailable } from './environment/browser';
const Platform = {
    /**
     * Denotes the currently running platform.
     * Can be one of ios, android, web.
     */
    OS: ReactNativePlatform.OS,
    /**
     * Returns the value with the matching platform.
     * Object keys can be any of ios, android, native, web, default.
     *
     * @ios ios, native, default
     * @android android, native, default
     * @web web, default
     */
    select: ReactNativePlatform.select,
    /**
     * Denotes if the DOM API is available in the current environment.
     * The DOM is not available in native React runtimes and Node.js.
     */
    isDOMAvailable,
};
export default Platform;
//# sourceMappingURL=Platform.js.map