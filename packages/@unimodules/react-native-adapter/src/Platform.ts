import { Platform as ReactNativePlatform } from 'react-native';

import { isDOMAvailable } from './environment/browser';

export type PlatformOSType =
  | 'ios'
  | 'android'
  | 'web'
  | 'native'
  | 'macos'
  | 'windows'
  | 'electron';

export type PlatformSelect = <T>(
  specifics:
    | ({ [platform in PlatformOSType]?: T } & { default: T })
    | { [platform in PlatformOSType]: T }
) => T;

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
  select: ReactNativePlatform.select as PlatformSelect,
  /**
   * Used for delegating node actions when browser APIs aren't available
   * like in SSR websites. DOM is not available in native React runtimes.
   */
  isDOMAvailable,
};

export default Platform;
