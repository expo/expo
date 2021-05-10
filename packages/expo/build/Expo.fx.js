import './environment/validate.fx';
// load remote logging for compatibility with custom development clients
import './environment/logging.fx';
import './environment/react-native-logs.fx';
// load expo-asset immediately to set a custom `source` transformer in React Native
import 'expo-asset';
import { NativeModulesProxy, Platform } from '@unimodules/core';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Font from 'expo-font';
import React from 'react';
import { AppRegistry, StyleSheet } from 'react-native';
import DevAppContainer from './environment/DevAppContainer';
// Represents an app running in the store client or an app built with the legacy `expo build` command.
// `false` when running in bare workflow, custom dev clients, or `eas build`s (managed or bare).
// This should be used to ensure code that _should_ exist is treated as such.
const isManagedEnvironment = Constants.executionEnvironment === ExecutionEnvironment.Standalone ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// If expo-font is installed and the style preprocessor is available, use it to parse fonts.
if (StyleSheet.setStyleAttributePreprocessor) {
    StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
}
// Add warning about removed navigator.geolocation polyfill.
if (Platform.OS !== 'web' && !window.navigator?.geolocation) {
    const logLocationPolyfillWarning = (method) => {
        return () => {
            console.warn(`window.navigator.geolocation.${method} is not available. Import and execute installWebGeolocationPolyfill() from expo-location to add it, or use the expo-location APIs instead.`);
        };
    };
    // @ts-ignore
    window.navigator.geolocation = {
        getCurrentPosition: logLocationPolyfillWarning('getCurrentPosition'),
        watchPosition: logLocationPolyfillWarning('watchPostion'),
        clearWatch: () => { },
        stopObserving: () => { },
    };
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
        AppRegistry.setWrapperComponentProvider = provider => {
            function PatchedProviderComponent(props) {
                const ProviderComponent = provider();
                return (React.createElement(DevAppContainer, null,
                    React.createElement(ProviderComponent, Object.assign({}, props))));
            }
            originalSetWrapperComponentProvider(() => PatchedProviderComponent);
        };
    }
}
//# sourceMappingURL=Expo.fx.js.map