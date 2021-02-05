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

// install globals
declare let module: any;

import DevAppContainer from './environment/DevAppContainer';

// Represents an app running in the store client or an app built with the legacy `expo build` command.
// `false` when running in bare workflow, custom dev clients, or `eas build`s (managed or bare).
// This should be used to ensure code that _should_ exist is treated as such.
const isLegacyManagedWorkflow = Constants.executionEnvironment === ExecutionEnvironment.Standalone || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// If expo-font is installed and the style preprocessor is available, use it to parse fonts.
if (StyleSheet.setStyleAttributePreprocessor) {
  try {
    const Font = require('expo-font');
    StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
  } catch (error) {
    if (isLegacyManagedWorkflow) {
      // If the packages should exist, then surface the error for debugging.
      throw error;
    }
  }
}

try {
  const { installWebGeolocationPolyfill } = require('expo-location');
  // polyfill navigator.geolocation
  installWebGeolocationPolyfill();
} catch (error) {
  if (isLegacyManagedWorkflow) {
    throw error
  }
  // Package isn't installed so don't install the polyfill.
  // TODO: Deprecate this in the future because the side effect is just a convenience.
}

if (module && module.exports && global) {
  try {
    const globals = require('./globals');

    // @ts-ignore
    global.__exponent = globals;
    // @ts-ignore
    global.__expo = globals;
    // @ts-ignore
    global.Expo = globals;
  } catch (error) {
    if (isLegacyManagedWorkflow) {
      throw error
    }
    // Package isn't installed so don't install the polyfill.
    // TODO: Deprecate this in the future because the side effect is just a convenience.
  }
}

// TODO(NO_MERGE): In theory, shouldn't this also run in managed workflow so there is no unexpected error being thrown in a managed `eas build`?
if (!isLegacyManagedWorkflow) {
  if (NativeModulesProxy.ExpoUpdates?.isMissingRuntimeVersion) {
    const message =
      'expo-updates is installed but there is no runtime or SDK version configured. ' +
      "You'll need to configure one of these two properties in " +
      Platform.select({ ios: 'Expo.plist', android: 'AndroidManifest.xml' }) +
      ' before OTA updates will work properly.';
    if (__DEV__) {
      console.warn(message);
    } else {
      throw new Error(message);
    }
  }
}

// Disable the blue loading box because `NativeModules.DevLoadingView` is not available in bare workflow.
if (isLegacyManagedWorkflow) {
  // add the dev app container wrapper component on ios
  if (__DEV__) {
    if (Platform.OS === 'ios') {
      // @ts-ignore
      AppRegistry.setWrapperComponentProvider(() => DevAppContainer);

      // @ts-ignore
      const originalSetWrapperComponentProvider = AppRegistry.setWrapperComponentProvider;

      // @ts-ignore
      AppRegistry.setWrapperComponentProvider = provider => {
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
  }
}
