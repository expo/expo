// load expo-asset immediately to set a custom `source` transformer in React Native
import './winter';
import 'expo-asset';
import * as Font from 'expo-font';
import { AppRegistry, StyleSheet } from 'react-native';
import { isRunningInExpoGo } from './environment/ExpoGo';
import { AppEntryNotFound } from './errors/AppEntryNotFound';
import { createErrorHandler } from './errors/ExpoErrorManager';
// If expo-font is installed and the style preprocessor is available, use it to parse fonts.
if (StyleSheet.setStyleAttributePreprocessor) {
    StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
}
if (isRunningInExpoGo()) {
    // set up some improvements to commonly logged error messages stemming from react-native
    const globalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(createErrorHandler(globalHandler));
}
if (process.env.NODE_ENV !== 'production') {
    // Register a default component and expect `registerRootComponent` to be called later and update it.
    AppRegistry.registerComponent('main', () => AppEntryNotFound);
}
//# sourceMappingURL=Expo.fx.js.map