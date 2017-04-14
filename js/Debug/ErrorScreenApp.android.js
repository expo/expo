/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ErrorScreenApp
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  BackAndroid,
  Image,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import autobind from 'autobind-decorator';
import ExNavigator from '@expo/react-native-navigator';

import ConsoleRouter from 'ConsoleRouter';
import ExColors from 'ExColors';

const { ExponentConstants, ExponentKernel } = NativeModules;

export default class ErrorScreenApp extends React.Component {
  static propTypes = {
    isShellApp: PropTypes.bool,
    userErrorMessage: PropTypes.string,
    developerErrorMessage: PropTypes.string,
  };

  componentDidMount() {
    if (Platform.OS === 'android') {
      BackAndroid.addEventListener(
        'hardwareBackPress',
        this._handleBackButtonPress
      );
    }
  }

  render() {
    let initialRoute = this._getErrorScreenRoute();
    return (
      <View style={styles.container}>
        <ExNavigator
          ref={component => {
            this._navigator = component;
          }}
          initialRoute={initialRoute}
          showNavigationBar={false}
          style={styles.container}
          sceneStyle={styles.scene}
        />
      </View>
    );
  }

  @autobind _handleBackButtonPress() {
    if (
      this._consoleNavigator &&
      this._consoleNavigator.getCurrentRoutes() &&
      this._consoleNavigator.getCurrentRoutes().length > 1
    ) {
      this._consoleNavigator.pop();
      return true;
    } else if (
      this._navigator &&
      this._navigator.getCurrentRoutes() &&
      this._navigator.getCurrentRoutes().length > 1
    ) {
      this._navigator.pop();
      return true;
    } else {
      return false;
    }
  }

  @autobind _navigateToConsoleHistory() {
    this._navigator.push(this._getConsoleHistoryRoute());
  }

  @autobind _getErrorScreenRoute() {
    let self = this;
    return {
      renderScene() {
        return (
          <View style={styles.container}>
            <View style={styles.topContainer}>
              <View style={styles.errorTextContainer}>
                <Text style={styles.bigText}>Something went wrong.</Text>
                <Text style={styles.smallText}>
                  {self._errorText()}
                </Text>
              </View>
              {self._renderButtons()}
            </View>
            <TouchableOpacity
              style={styles.bottomContainer}
              hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
              onPress={self._navigateToConsoleHistory}>
              <Text style={styles.viewErrorsText}>View error log</Text>
            </TouchableOpacity>
          </View>
        );
      },
    };
  }

  @autobind _errorText() {
    if (this.props.userErrorMessage && this.props.userErrorMessage.length > 0) {
      return this.props.userErrorMessage;
    } else if (this.props.isShellApp) {
      return 'Sorry about that. Press the reload button to try again.';
    } else {
      return 'Sorry about that. You can go back to Exponent home or try to reload the Experience.';
    }
  }

  @autobind _getConsoleHistoryRoute() {
    let self = this;
    return {
      renderScene() {
        let initialRoute = ConsoleRouter.getConsoleHistoryRoute(null);
        return (
          <View style={styles.consoleHistoryContainer}>
            {self._renderButtons()}
            <ExNavigator
              ref={component => {
                self._consoleNavigator = component;
              }}
              initialRoute={initialRoute}
              showNavigationBar={false}
              style={styles.consoleHistoryContainer}
              sceneStyle={styles.scene}
            />
          </View>
        );
      },

      configureScene() {
        return ExNavigator.SceneConfigs.FloatFromRight;
      },
    };
  }

  @autobind _renderButtons() {
    return (
      <View style={styles.navBar}>
        {this.props.isShellApp
          ? null
          : <TouchableOpacity
              onPress={() => ExponentKernel.goToHomeFromErrorScreen()}>
              <Image
                source={{ uri: 'ic_home_white_36dp' }}
                style={styles.icon}
              />
            </TouchableOpacity>}
        <TouchableOpacity
          onPress={() => ExponentKernel.reloadFromErrorScreen()}>
          <Image
            source={{ uri: 'ic_refresh_white_36dp' }}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    );
  }
}

// Tell Java that it can send us DeviceEventEmitter events now.
ExponentKernel.onLoaded();

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ExColors.navy,
  },
  topContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTextContainer: {
    alignItems: 'center',
    marginBottom: 60,
    marginHorizontal: 40,
  },
  bigText: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 20,
  },
  smallText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  viewErrorsText: {
    color: 'rgba(200, 200, 200, 0.4)',
    fontSize: 13,
    textAlign: 'center',
  },
  consoleHistoryContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navBar: {
    paddingTop: ExponentConstants.statusBarHeight,
    paddingHorizontal: 40,
    flexDirection: 'row',
    height: 80,
    backgroundColor: ExColors.navy,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  icon: {
    width: 36,
    height: 36,
  },
  scene: {
    backgroundColor: 'transparent',
  },
});
