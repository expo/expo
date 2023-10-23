// load expo-asset immediately to set a custom `source` transformer in React Native
import './winter';
import 'expo-asset';
import * as Font from 'expo-font';
import { NativeModulesProxy, Platform } from 'expo-modules-core';
import { StyleSheet } from 'react-native';
import { isRunningInExpoGo } from './environment/ExpoGo';
import { createErrorHandler } from './errors/ExpoErrorManager';
// If expo-font is installed and the style preprocessor is available, use it to parse fonts.
if (StyleSheet.setStyleAttributePreprocessor) {
    StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
}
// Asserts if bare workflow isn't setup correctly.
if (NativeModulesProxy.ExpoUpdates?.isMissingRuntimeVersion) {
    const message = 'expo-updates is installed but there is no runtime or SDK version configured. ' +
        "You'll need to configure one of these two properties in " +
        Platform.select({ ios: 'Expo.plist', android: 'AndroidManifest.xml' }) +
        ' before OTA updates will work properly.';
    if (__DEV__) {
        console.warn(message);
    }
    else {
        throw new Error(message);
    }
}
if (isRunningInExpoGo()) {
    // set up some improvements to commonly logged error messages stemming from react-native
    const globalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(createErrorHandler(globalHandler));
}
//# sourceMappingURL=Expo.fx.js.map