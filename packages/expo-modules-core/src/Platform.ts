import { PlatformOSType, Platform as ReactNativePlatform } from 'react-native';

import {
  isDOMAvailable,
  canUseEventListeners,
  canUseViewport,
  isAsyncDebugging,
} from './environment/browser';

export type PlatformSelectOSType = PlatformOSType | 'native' | 'electron' | 'default';

export type PlatformSelect = <T>(specifics: { [platform in PlatformSelectOSType]?: T }) => T;

if (__DEV__ && typeof process.env.EXPO_OS === 'undefined') {
  console.warn(
    `The global process.env.EXPO_OS is not defined. This should be inlined by babel-preset-expo during transformation.`
  );
}

const nativeSelect =
  typeof window !== 'undefined'
    ? ReactNativePlatform.select
    : // process.env.EXPO_OS is injected by `babel-preset-expo` and available in both client and `react-server` environments.
      // Opt to use the env var when possible, and fallback to the React Native Platform module when it's not (arbitrary bundlers and transformers).
      function select<T>(specifics: { [platform in PlatformSelectOSType]?: T }): T | undefined {
        if (!process.env.EXPO_OS) return undefined;
        if (specifics.hasOwnProperty(process.env.EXPO_OS)) {
          return specifics[process.env.EXPO_OS as PlatformSelectOSType]!;
        } else if (process.env.EXPO_OS !== 'web' && specifics.hasOwnProperty('native')) {
          return specifics.native!;
        } else if (specifics.hasOwnProperty('default')) {
          return specifics.default!;
        }
        // do nothing...
        return undefined;
      };

const Platform = {
  /**
   * Denotes the currently running platform.
   * Can be one of ios, android, web.
   */
  OS: process.env.EXPO_OS || ReactNativePlatform.OS,
  /**
   * Returns the value with the matching platform.
   * Object keys can be any of ios, android, native, web, default.
   *
   * @ios ios, native, default
   * @android android, native, default
   * @web web, default
   */
  select: nativeSelect as PlatformSelect,
  /**
   * Denotes if the DOM API is available in the current environment.
   * The DOM is not available in native React runtimes and Node.js.
   */
  isDOMAvailable,
  /**
   * Denotes if the current environment can attach event listeners
   * to the window. This will return false in native React
   * runtimes and Node.js.
   */
  canUseEventListeners,
  /**
   * Denotes if the current environment can inspect properties of the
   * screen on which the current window is being rendered. This will
   * return false in native React runtimes and Node.js.
   */
  canUseViewport,
  /**
   * If the JavaScript is being executed in a remote JavaScript environment.
   * When `true`, synchronous native invocations cannot be executed.
   */
  isAsyncDebugging,
};

export default Platform;
