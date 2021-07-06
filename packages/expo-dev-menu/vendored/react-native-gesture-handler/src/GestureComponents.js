import React from 'react';
import ReactNative from 'react-native';

import createNativeWrapper from './createNativeWrapper';

const MEMOIZED = new WeakMap();

function memoizeWrap(Component, config) {
  if (Component == null) {
    return null;
  }
  let memoized = MEMOIZED.get(Component);
  if (!memoized) {
    memoized = createNativeWrapper(Component, config);
    MEMOIZED.set(Component, memoized);
  }
  return memoized;
}

module.exports = {
  /* RN's components */
  get ScrollView() {
    return memoizeWrap(ReactNative.ScrollView, {
      disallowInterruption: true,
      shouldCancelWhenOutside: false,
    });
  },
  get Switch() {
    return memoizeWrap(ReactNative.Switch, {
      shouldCancelWhenOutside: false,
      shouldActivateOnStart: true,
      disallowInterruption: true,
    });
  },
  get TextInput() {
    return memoizeWrap(ReactNative.TextInput);
  },
  get DrawerLayoutAndroid() {
    const DrawerLayoutAndroid = memoizeWrap(ReactNative.DrawerLayoutAndroid, {
      disallowInterruption: true,
    });
    DrawerLayoutAndroid.positions = ReactNative.DrawerLayoutAndroid.positions;
    return DrawerLayoutAndroid;
  },
  get FlatList() {
    if (!MEMOIZED.FlatList) {
      const ScrollView = this.ScrollView;
      MEMOIZED.FlatList = React.forwardRef((props, ref) => (
        <ReactNative.FlatList
          ref={ref}
          {...props}
          renderScrollComponent={scrollProps => <ScrollView {...scrollProps} />}
        />
      ));
    }
    return MEMOIZED.FlatList;
  },
};
