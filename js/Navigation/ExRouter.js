/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExRouter
 * @flow weak
 */
'use strict';

import ExNavigator from '@exponent/react-native-navigator';
import React from 'react';

import SceneConfigs from 'SceneConfigs';

let ExRouter = {
  getHomeRoute() {
    return {
      getSceneClass() {
        return require('../Home/HomeApp').default;
      },
    };
  },

  getBrowserRoute(url) {
    return {
      configureScene() {
        return SceneConfigs.ZoomFromFront;
      },
      renderScene(navigator) {
        let BrowserScreen = require('BrowserScreen').default;
        return (
          <BrowserScreen
            navigator={navigator}
            url={url}
          />
        );
      },
    };
  },

  getConsoleRoute(onPressReload, isUserFacing) {
    return {
      isConsole: true,

      renderScene(navigator) {
        let ConsoleNavigator = require('ConsoleNavigator').default;
        return (
          <ConsoleNavigator
            navigator={navigator}
            onPressReload={onPressReload}
            isUserFacing={isUserFacing}
          />
        );
      },

      configureScene() {
        return ExNavigator.SceneConfigs.FloatFromBottom;
      },
    };
  },
};

export default ExRouter;
