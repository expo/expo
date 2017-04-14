/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExponentTestsApp
 */
import React from 'react';
import { AppRegistry, View } from 'react-native';

import FrameTests from 'FrameTests';
AppRegistry.registerComponent('FrameTests', () => FrameTests);

class ExponentTestsApp extends React.Component {
  render() {
    return <View />;
  }
}

AppRegistry.registerComponent('ExponentTestsApp', () => ExponentTestsApp);
