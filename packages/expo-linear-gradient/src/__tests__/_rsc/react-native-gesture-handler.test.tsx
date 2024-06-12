import React from 'react';
import {
  BaseButton,
  BorderlessButton,
  DrawerLayout,
  DrawerLayoutAndroid,
  FlatList,
  FlingGestureHandler,
} from 'react-native-gesture-handler';

Object.entries({
  BaseButton,
  BorderlessButton,
  DrawerLayout,
  DrawerLayoutAndroid,
  FlatList,
  FlingGestureHandler,
}).forEach(([name, Component]) => {
  it(`renders ${name} to RSC`, async () => {
    const jsx = <Component />;

    await expect(jsx).toMatchFlightSnapshot();
  });
});
