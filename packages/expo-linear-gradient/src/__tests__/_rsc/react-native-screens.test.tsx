import React from 'react';

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

Object.entries({
 
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
