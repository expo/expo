/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExStyles
 * @flow
 */
'use strict';

import {
  Dimensions,
} from 'react-native';

import ExColors from 'ExColors';

let windowDimensions = Dimensions.get('window');

export default {
  text: {
    color: ExColors.text,
  },
  errorBar: {
    marginTop: 10,
    backgroundColor: 'red',
    paddingVertical: 4,
    borderRadius: 3,
    width: windowDimensions.width,
  },
};
