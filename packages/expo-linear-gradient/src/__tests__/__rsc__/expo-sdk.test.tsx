import React from 'react';

import 'expo';
import { StatusBar} from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
Screen,
NativeScreen,
InnerScreen,
ScreenContainer,
NativeScreenContainer,
NativeScreenNavigationContainer,
ScreenStackHeaderConfig,
ScreenStackHeaderSubview,
ScreenStackHeaderLeftView,
ScreenStackHeaderCenterView,
ScreenStackHeaderRightView,
ScreenStackHeaderBackButtonImage,
ScreenStackHeaderSearchBarView,
SearchBar,
NativeSearchBar,
NativeSearchBarCommands,
FullWindowOverlay,
 } from 'react-native-screens'


// react
// react-native
// expo
// expo-status-bar
// react-native-safe-area-context
// react-native-screens
// @react-navigation/native
// react-native-gesture-handler
// @react-native-async-storage/async-storage
// expo-splash-screen
// react-native-reanimated
// react-native-svg
// expo-constants
// expo-font
// react-dom
// expo-linking
// expo-dev-client

Object.entries({
    StatusBar,

    //
Screen,
NativeScreen,
InnerScreen,
ScreenContainer,
NativeScreenContainer,
NativeScreenNavigationContainer,
ScreenStackHeaderConfig,
ScreenStackHeaderSubview,
ScreenStackHeaderLeftView,
ScreenStackHeaderCenterView,
ScreenStackHeaderRightView,
ScreenStackHeaderBackButtonImage,
ScreenStackHeaderSearchBarView,
SearchBar,
NativeSearchBar,
NativeSearchBarCommands,
FullWindowOverlay,
//
}).forEach(([name, Component]) => {
  it(`renders ${name} to RSC`, async () => {
    const jsx = <Component />;

    await expect(jsx).toMatchFlightSnapshot();
  });
});
