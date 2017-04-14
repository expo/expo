/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ConsoleRouter
 */
'use strict';

import { Text, TouchableOpacity } from 'react-native';
import React from 'react';

import ExNavigator from '@expo/react-native-navigator';

let ConsoleRouter = {
  getConsoleHistoryRoute(onPressReload, isUserFacing) {
    return {
      getTitle() {
        return isUserFacing ? 'Error' : 'Console';
      },

      renderScene(navigator) {
        let ConsoleHistoryScreen = require('ConsoleHistoryScreen').default;
        return (
          <ConsoleHistoryScreen
            navigator={navigator}
            isUserFacing={isUserFacing}
          />
        );
      },

      renderLeftButton(navigator) {
        return (
          <TouchableOpacity
            onPress={() => navigator.parentNavigator.pop()}
            touchRetentionOffset={
              ExNavigator.Styles.barButtonTouchRetentionOffset
            }
            style={ExNavigator.Styles.barLeftButton}>
            <Text style={ExNavigator.Styles.barLeftButtonText}>
              Dismiss
            </Text>
          </TouchableOpacity>
        );
      },

      renderRightButton(navigator) {
        return (
          <TouchableOpacity
            onPress={event => {
              navigator.parentNavigator.pop();
              onPressReload(event);
            }}
            touchRetentionOffset={
              ExNavigator.Styles.barButtonTouchRetentionOffset
            }
            style={ExNavigator.Styles.barRightButton}>
            <Text style={ExNavigator.Styles.barRightButtonText}>
              Refresh
            </Text>
          </TouchableOpacity>
        );
      },
    };
  },

  getConsoleErrorRoute(errorId) {
    return {
      getTitle() {
        return 'Error';
      },

      renderScene(navigator) {
        let ConsoleErrorScreen = require('ConsoleErrorScreen').default;
        return <ConsoleErrorScreen navigator={navigator} errorId={errorId} />;
      },
    };
  },
};

export default ConsoleRouter;
