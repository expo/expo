// load expo-asset immediately to set a custom `source` transformer in React Native
import './winter';
import 'expo-asset';

import { AppRegistry, NativeModules, LogBox } from 'react-native';

import { isRunningInExpoGo } from './environment/ExpoGo';
import { AppEntryNotFound } from './errors/AppEntryNotFound';
import { createErrorHandler } from './errors/ExpoErrorManager';

if (isRunningInExpoGo()) {
  // set up some improvements to commonly logged error messages stemming from react-native
  const globalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler(createErrorHandler(globalHandler));
}

// Disable the "Open debugger to view warnings" React Native DevTools warning in
// Expo Go and expo-dev-client, because launching the debugger from there will not
// get the correct JS target.
const IS_RUNNING_IN_DEV_CLIENT = !!NativeModules.EXDevLauncher;
if (__DEV__ && (isRunningInExpoGo() || IS_RUNNING_IN_DEV_CLIENT)) {
  LogBox.ignoreLogs([/Open debugger to view warnings/]);
}

if (process.env.NODE_ENV !== 'production') {
  // Register a default component and expect `registerRootComponent` to be called later and update it.
  AppRegistry.registerComponent('main', () => AppEntryNotFound);
}
