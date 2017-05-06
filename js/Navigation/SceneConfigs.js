/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule SceneConfigs
 */
'use strict';

import { Navigator } from 'react-native-deprecated-custom-components';

import buildStyleInterpolator from 'buildStyleInterpolator';

let FromTheFront = {
  opacity: {
    from: 0,
    to: 1,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: false,
    round: 100,
  },
  transformScale: {
    from: { x: 1.05, y: 1.05, z: 1 },
    to: { x: 1, y: 1, z: 1 },
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
  },
};

let ToTheBack = {
  opacity: {
    value: 1,
    type: 'constant',
  },
  transformScale: {
    from: { x: 1, y: 1, z: 1 },
    to: { x: 0.95, y: 0.95, z: 1 },
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
  },
  scaleX: {
    from: 1,
    to: 0.95,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
  },
  scaleY: {
    from: 1,
    to: 0.95,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
  },
};

let SceneConfigs = {
  ZoomFromFront: {
    ...Navigator.SceneConfigs.FloatFromBottomAndroid,
    springFriction: 22,
    animationInterpolators: {
      into: buildStyleInterpolator(FromTheFront),
      out: buildStyleInterpolator(ToTheBack),
    },
  },
};

export default SceneConfigs;
