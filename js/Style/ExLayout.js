/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExLayout
 * @flow
 */
'use strict';

import {
  PixelRatio,
  Platform,
} from 'react-native';

let ExLayout = {
  pixel: 1 / PixelRatio.get(),
  footerHeight: 49,
};

let platformDependentLayout = {};

if (Platform.OS === 'ios') {
  platformDependentLayout = {
    statusBarHeight: 20,
    navigationBarHeight: 44,
  };
} else {
  platformDependentLayout = {
    statusBarHeight: 25,
    navigationBarHeight: 56,
  };
}
platformDependentLayout.headerHeight = platformDependentLayout.statusBarHeight + platformDependentLayout.navigationBarHeight;
Object.assign(ExLayout, platformDependentLayout);

export default ExLayout;
