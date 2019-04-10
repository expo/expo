'use strict';
import { createBrowserApp } from '@react-navigation/web';
import React from 'react';
import { createSwitchNavigator } from 'react-navigation';

import App from './App.js';
import BlurView from './screens/BlurView';
import LinearGradient from './screens/LinearGradient';
import ImageManipulator from './screens/ImageManipulator';

export default createBrowserApp(
  createSwitchNavigator({
    // We don't need the initial URL on web.
    App: { screen: () => <App exp={{}} /> },
    LinearGradient,
    BlurView,
    ImageManipulator,
  })
);
