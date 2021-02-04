// load remote logging for compatibility with custom development clients
import './environment/validate.fx';
import './environment/logging.fx';
import './environment/react-native-logs.fx';
// load expo-asset immediately to set a custom `source` transformer in React Native
import 'expo-asset';
import React from 'react';
import { NativeModulesProxy, Platform } from '@unimodules/core';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AppRegistry, StyleSheet } from 'react-native';
import DevAppContainer from './environment/DevAppContainer';
if (Constants.executionEnvironment === ExecutionEnvironment.Standalone ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    // add the dev app container wrapper component on ios
    if (__DEV__) {
        if (Platform.OS === 'ios') {
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
    if (StyleSheet.setStyleAttributePreprocessor) {
        let Font;
        try {
            Font = require('expo-font');
        }
        catch {
        }
        StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
    }
    try {
        const { installWebGeolocationPolyfill } = require('expo-location');
        // polyfill navigator.geolocation
        installWebGeolocationPolyfill();
    }
    catch { }
    if (module && module?.exports) {
        if (global) {
            try {
                const globals = require('./globals');
                // @ts-ignore
                global.__exponent = globals;
                // @ts-ignore
                global.__expo = globals;
                // @ts-ignore
                global.Expo = globals;
            }
            catch {
                // In case some imports aren't present in bare workflow.
            }
        }
    }
}
else {
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
}
//# sourceMappingURL=Expo.fx.js.map