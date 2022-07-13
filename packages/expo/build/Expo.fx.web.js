import './environment/react-native-logs.fx';
import { Platform } from 'expo-modules-core';
import * as React from 'react';
import { AppRegistry } from 'react-native';
import DevAppContainer from './environment/DevAppContainer';
// When users dangerously import a file inside of react-native, it breaks the web alias.
// This is one of the most common, and cryptic web errors that users encounter.
// This conditional side-effect provides a more helpful error message for debugging.
if (__DEV__) {
    // Use a wrapper `__DEV__` to remove this entire block in production.
    if (
    // Only on web platforms.
    Platform.OS === 'web' &&
        // Skip mocking if someone is shimming this value out.
        !('__fbBatchedBridgeConfig' in global)) {
        Object.defineProperty(global, '__fbBatchedBridgeConfig', {
            get() {
                throw new Error("Your web project is importing a module from 'react-native' instead of 'react-native-web'. Learn more: https://expo.fyi/fb-batched-bridge-config-web");
            },
        });
    }
    // add the dev app container wrapper component to web
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
//# sourceMappingURL=Expo.fx.web.js.map