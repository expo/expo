// load expo-asset immediately to set a custom `source` transformer in React Native
import './winter';
import 'expo-asset';

import { isRunningInExpoGo } from './environment/ExpoGo';
import { createErrorHandler } from './errors/ExpoErrorManager';

if (isRunningInExpoGo()) {
  // set up some improvements to commonly logged error messages stemming from react-native
  const globalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler(createErrorHandler(globalHandler));
}
