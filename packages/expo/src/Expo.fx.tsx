// load expo-asset immediately to set a custom `source` transformer in React Native
import './winter';
import 'expo-asset';
import 'expo/virtual/rsc';

import Constants from 'expo-constants';
import { AppRegistry, NativeModules, LogBox, Platform } from 'react-native';

import { isRunningInExpoGo } from './environment/ExpoGo';
import { AppEntryNotFound } from './errors/AppEntryNotFound';
import { createErrorHandler } from './errors/ExpoErrorManager';

if (isRunningInExpoGo()) {
  // set up some improvements to commonly logged error messages stemming from react-native
  const globalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler(createErrorHandler(globalHandler));
}

// Warn if the New Architecture is not explicitly enabled in the app config and we are running in Expo Go.
// This could be problematic because you will be developing your app with the New Architecture enabled and
// but your builds will have the New Architecture disabled.
if (__DEV__ && isRunningInExpoGo() && process.env.NODE_ENV === 'development') {
  (['android', 'ios'] as const).forEach((platform) => {
    const newArchPlatformConfig = Constants.expoConfig?.[platform]?.newArchEnabled;
    const newArchRootConfig = Constants.expoConfig?.newArchEnabled;

    const isNewArchExplicitlyDisabled =
      newArchPlatformConfig === false ||
      (newArchPlatformConfig === undefined && newArchRootConfig === false);

    if (Platform.OS === platform && isNewArchExplicitlyDisabled) {
      // Wrap it in rAF to show the warning after the React Native DevTools message
      requestAnimationFrame(() => {
        console.warn(
          `🚨 React Native's New Architecture is always enabled in Expo Go, but it is explicitly disabled in your project's app config. This may lead to unexpected behavior when creating a production or development build. Remove "newArchEnabled": false from your app.json.\nLearn more: https://docs.expo.dev/guides/new-architecture/`
        );
      });
    }
  });
}

// Disable the "Open debugger to view warnings" React Native DevTools warning in
// Expo Go and expo-dev-client, because launching the debugger from there will not
// get the correct JS target.
const IS_RUNNING_IN_DEV_CLIENT = !!NativeModules.EXDevLauncher;
if (__DEV__ && LogBox?.ignoreLogs && (isRunningInExpoGo() || IS_RUNNING_IN_DEV_CLIENT)) {
  LogBox.ignoreLogs([/Open debugger to view warnings/]);
}

if (process.env.NODE_ENV !== 'production') {
  // Register a default component and expect `registerRootComponent` to be called later and update it.
  AppRegistry.registerComponent('main', () => AppEntryNotFound);
}
