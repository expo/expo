import type { ExpoConfig } from '@expo/config-types';

import type { InfoPlist } from './IosConfig.types';
import { createInfoPlistPlugin } from '../plugins/ios-plugins';

/**
 * Info.plist key read by expo's native runtime (`ExpoReactNativeFactory`) to resolve the Metro
 * dev server port at launch. It is set to the `RCT_METRO_PORT` build setting so that
 * `expo run:ios --port <n>` flows through to the app.
 *
 * Prebuilt React freezes the compile-time `RCT_METRO_PORT` at `8081`, so without this a bare dev
 * build (no `expo-dev-client`) always defaults to `:8081` and multiple running projects collide on
 * a single dev server. This is the iOS analog of Android's `react_native_dev_server_port` resource.
 */
export const METRO_PORT_INFO_PLIST_KEY = 'RCTMetroPort';

export const withMetroPort = createInfoPlistPlugin(setMetroPort, 'withMetroPort');

export function setMetroPort(_config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist {
  return {
    ...infoPlist,
    [METRO_PORT_INFO_PLIST_KEY]: '$(RCT_METRO_PORT)',
  };
}
