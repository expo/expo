import React from 'react';

import 'expo';
import { StatusBar} from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen'
// import * as Linking from 'expo-linking'

// describe('linking', () => {
//     it(`evaluates`, () => {
//         Linking.canOpenURL('exp://');
//     })

// })

// @react-navigation/native
// @react-native-async-storage/async-storage
// react-native-reanimated
// expo
// expo-status-bar
// expo-splash-screen
// expo-constants
// expo-font
// expo-linking
// expo-dev-client

Object.entries({
    StatusBar,
}).forEach(([name, Component]) => {
  it(`renders ${name} to RSC`, async () => {
    const jsx = <Component />;

    await expect(jsx).toMatchFlightSnapshot();
  });
});
