import './environment/validate.fx';
import './environment/logging.fx';
import './environment/muteWarnings.fx';
// load expo-asset immediately to set a custom `source` transformer in React Native
import 'expo-asset';
import Constants from 'expo-constants';
import * as Font from 'expo-font';
import { installWebGeolocationPolyfill } from 'expo-location';
import * as React from 'react';
import { AppRegistry, Platform, StyleSheet } from 'react-native';
import DevAppContainer from './environment/DevAppContainer';
if (Constants.manifest && typeof Constants.manifest.env === 'object') {
    Object.assign(process.env, Constants.manifest.env);
}
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
                return (<DevAppContainer>
            <ProviderComponent {...props}/>
          </DevAppContainer>);
            }
            originalSetWrapperComponentProvider(() => PatchedProviderComponent);
        };
    }
}
if (StyleSheet.setStyleAttributePreprocessor) {
    StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
}
// polyfill navigator.geolocation
installWebGeolocationPolyfill();
if (module && module.exports) {
    if (global) {
        const globals = require('./globals');
        // @ts-ignore
        global.__exponent = globals;
        // @ts-ignore
        global.__expo = globals;
        // @ts-ignore
        global.Expo = globals;
    }
}
//# sourceMappingURL=Expo.fx.expo.js.map