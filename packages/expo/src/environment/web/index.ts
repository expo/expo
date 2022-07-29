import { Platform } from 'expo-modules-core';

declare const global: {
  __DEV__?: boolean;
  __METRO_GLOBAL_PREFIX__?: string;
  RN$Bridgeless?: boolean;
  WebSocket: any;
};

if (
  // Only during development.
  global.__DEV__ &&
  // Disable for SSR
  Platform.isDOMAvailable &&
  // Disable for non-metro runtimes
  // NOTE(EvanBacon): This can probably be removed in favor of `expo/metro-config` injecting this file.
  global.__METRO_GLOBAL_PREFIX__ != null
) {
  require('./fastRefresh');
  require('./hmr');
  require('./messageSocket');
}
