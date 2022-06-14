import * as React from 'react';
import {
  DrawerLayoutAndroid as RNDrawerLayoutAndroid,
  FlatList as RNFlatList,
  Switch as RNSwitch,
  TextInput as RNTextInput,
  ScrollView as RNScrollView,
  FlatListProps,
} from 'react-native';

import createNativeWrapper from '../handlers/createNativeWrapper';

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
// @ts-ignore -- TODO(TS) to investigate if it's needed
DrawerLayoutAndroid.positions = RNDrawerLayoutAndroid.positions;

export const FlatList = React.forwardRef(
  <ItemT extends any>(props: FlatListProps<ItemT>, ref: any) => (
    <RNFlatList
      ref={ref}
      {...props}
      renderScrollComponent={(scrollProps) => <ScrollView {...scrollProps} />}
    />
  )
);
