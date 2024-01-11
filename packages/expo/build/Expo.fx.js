// load expo-asset immediately to set a custom `source` transformer in React Native
import './winter';
import 'expo-asset';
import * as Font from 'expo-font';
import { StyleSheet } from 'react-native';
import { isRunningInExpoGo } from './environment/ExpoGo';
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
//# sourceMappingURL=Expo.fx.js.map