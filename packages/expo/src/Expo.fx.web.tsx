import './environment/react-native-logs.fx';

import { Platform } from 'expo-modules-core';
import { AppRegistry, StyleSheet } from 'react-native';
import * as React from 'react';

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
    !('__fbBatchedBridgeConfig' in global)
  ) {
    Object.defineProperty(global, '__fbBatchedBridgeConfig', {
      get() {
        throw new Error(
          "Your web project is importing a module from 'react-native' instead of 'react-native-web'. Learn more: https://expo.fyi/fb-batched-bridge-config-web"
        );
      },
    });
  }


  // Having two if statements will enable terser to remove the entire block.
  // Only enable the fast refresh indicator for managed iOS apps in dev mode.

  // add the dev app container wrapper component on ios
  // @ts-ignore
  AppRegistry.setWrapperComponentProvider(() => DevAppContainer);

  // @ts-ignore
  const originalSetWrapperComponentProvider = AppRegistry.setWrapperComponentProvider;

  // @ts-ignore
  AppRegistry.setWrapperComponentProvider = (provider) => {
    function PatchedProviderComponent(props: any) {
      const ProviderComponent = provider();

      return (
        <DevAppContainer>
          <ProviderComponent {...props} />
        </DevAppContainer>
      );
    }

    originalSetWrapperComponentProvider(() => PatchedProviderComponent);
  };


}
