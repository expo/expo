/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExLayout
 * @flow
 */

import { PixelRatio, Platform } from 'react-native';

let platformIndependentLayout = {
  pixel: 1 / PixelRatio.get(),
  footerHeight: 49,
};

let platformDependentLayout = {};

if (Platform.OS === 'ios') {
  platformDependentLayout = {
    statusBarHeight: 20,
    navigationBarHeight: 44,
    headerHeight: 20 + 44,
  };
} else {
  platformDependentLayout = {
    statusBarHeight: 25,
    navigationBarHeight: 56,
    headerHeight: 25 + 56,
  };
}

export default {
  ...platformIndependentLayout,
  ...platformDependentLayout,
};
