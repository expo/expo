import React from 'react';
import {
  DrawerLayoutAndroid as RNDrawerLayoutAndroid,
  FlatList as RNFlatList,
  Switch as RNSwitch,
  TextInput as RNTextInput,
  ScrollView as RNScrollView,
} from 'react-native';

import createNativeWrapper from './createNativeWrapper';

export const ScrollView = createNativeWrapper(RNScrollView, {
  disallowInterruption: true,
});

export const Switch = createNativeWrapper(RNSwitch, {
  shouldCancelWhenOutside: false,
  shouldActivateOnStart: true,
  disallowInterruption: true,
});
export const TextInput = createNativeWrapper(RNTextInput);
export const DrawerLayoutAndroid = createNativeWrapper(RNDrawerLayoutAndroid, {
  disallowInterruption: true,
});
DrawerLayoutAndroid.positions = RNDrawerLayoutAndroid.positions;

export const FlatList = React.forwardRef((props, ref) => (
  <RNFlatList
    ref={ref}
    {...props}
    renderScrollComponent={scrollProps => <ScrollView {...scrollProps} />}
  />
));
