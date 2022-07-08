import './environment/validate.fx';
// load remote logging for compatibility with custom development clients
import './environment/logging.fx';
import './environment/react-native-logs.fx';
// load expo-asset immediately to set a custom `source` transformer in React Native
import 'expo-asset';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Font from 'expo-font';
import { NativeModulesProxy, Platform } from 'expo-modules-core';
import React from 'react';
import { AppRegistry, StyleSheet } from 'react-native';
import DevAppContainer from './environment/DevAppContainer';
import { createErrorHandler } from './errors/ExpoErrorManager';
// Represents an app running in the store client or an app built with the legacy `expo build` command.
// `false` when running in bare workflow, custom dev clients, or `eas build`s (managed or bare).
// This should be used to ensure code that _should_ exist is treated as such.
const isManagedEnvironment = Constants.executionEnvironment === ExecutionEnvironment.Standalone ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// If expo-font is installed and the style preprocessor is available, use it to parse fonts.
if (StyleSheet.setStyleAttributePreprocessor) {
    if (__DEV__) {
        // Temporarily disable console.warn() in dev mode,
        // because the experimented `StyleSheet.setStyleAttributePreprocessor` will show a warning about
        // `Overwriting fontFamily style attribute preprocessor`.
        const originalConsoleWarn = global.console.warn;
        global.console.warn = () => { };
        StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
        global.console.warn = originalConsoleWarn;
    }
    else {
        StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
    }
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
if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    // set up some improvements to commonly logged error messages stemming from react-native
    const globalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(createErrorHandler(globalHandler));
}
// Having two if statements will enable terser to remove the entire block.
if (__DEV__) {
    // Only enable the fast refresh indicator for managed iOS apps in dev mode.
    if (isManagedEnvironment && Platform.OS === 'ios') {
        // add the dev app container wrapper component on ios
        // @ts-ignore
        AppRegistry.setWrapperComponentProvider(() => DevAppContainer);
        // @ts-ignore
        const originalSetWrapperComponentProvider = AppRegistry.setWrapperComponentProvider;
        // @ts-ignore
        AppRegistry.setWrapperComponentProvider = (provider) => {
            function PatchedProviderComponent(props) {
                const ProviderComponent = provider();
                return (React.createElement(DevAppContainer, null,
                    React.createElement(ProviderComponent, { ...props })));
            }
            originalSetWrapperComponentProvider(() => PatchedProviderComponent);
        };
    }
}
//# sourceMappingURL=Expo.fx.js.map