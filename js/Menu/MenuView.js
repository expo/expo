/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule MenuView
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  NativeModules,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

let {
  ExponentKernel,
} = NativeModules;

import Expo from 'expo';
import ResponsiveImage from '@expo/react-native-responsive-image';

import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import DevIndicator from '../Home/components/DevIndicator';
import ExStore from 'ExStore';
import FriendlyUrls from 'FriendlyUrls';

let SCREEN_WIDTH = Dimensions.get('window').width;
let MENU_NARROW_SCREEN = (SCREEN_WIDTH < 375);

const AnimatedBlurView = Animated.createAnimatedComponent(Expo.BlurView);

export default class MenuView extends React.Component {

  static propTypes = {
    task: PropTypes.object.isRequired,
    shouldFadeIn: PropTypes.bool,
    isNuxFinished: PropTypes.bool,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      transitionIn: new Animated.Value(props.shouldFadeIn ? 0 : 1),
      enableDevMenuTools: false,
      devMenuItems: {},
    };
  }

  async componentDidMount() {
    this._mounted = true;
    if (this.props.shouldFadeIn) {
      Animated.timing(this.state.transitionIn, {
        easing: Easing.inOut(Easing.quad),
        toValue: 1,
        duration: 200,
      }).start();
    }
    let enableDevMenuTools = await ExponentKernel.doesCurrentTaskEnableDevtools();
    let devMenuItems = await ExponentKernel.getDevMenuItemsToShow();
    if (this._mounted) {
      this.setState({ enableDevMenuTools, devMenuItems });
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  render() {
    let scale = this.state.transitionIn.interpolate({
      inputRange: [0, 1],
      outputRange: [1.1, 1],
    });
    let intensity = this.state.transitionIn.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 90],
    });

    return (
      <AnimatedBlurView
        style={styles.container}
        tint="light"
        intensity={intensity}
        onStartShouldSetResponder={() => true}
        onResponderGrant={this._onPressContainer}>
        <Animated.View style={[styles.overlay, {opacity: this.state.transitionIn, transform: [{scale}]}]}>
          {this.props.isNuxFinished ? this._renderTaskInfoRow() : this._renderNUXRow()}
          <View style={styles.separator} />
          <View style={styles.buttonContainer}>
            {this._renderButton('refresh', 'Refresh', Browser.refresh, require('../Assets/ios-menu-refresh.png'))}
            {this._renderButton('home', 'Go to Expo Home', this._goToHome, require('../Assets/ios-menu-home.png'))}
          </View>
          {this._maybeRenderDevMenuTools()}
        </Animated.View>
      </AnimatedBlurView>
    );
  }

  _renderNUXRow() {
    let tooltipMessage;
    if (Expo.Constants.isDevice) {
      tooltipMessage = 'Shake your device to show this menu.';
    } else {
      tooltipMessage = 'In iPhone Simulator, press Cmd+D to show this menu.';
    }
    let headingStyles = (MENU_NARROW_SCREEN) ?
      [styles.nuxHeading, styles.nuxHeadingNarrow] :
      styles.nuxHeading;
    return (
      <View style={styles.nuxRow}>
        <View style={styles.nuxHeadingRow}>
          <ResponsiveImage
            sources={{
              2: { uri: 'https://s3.amazonaws.com/exp-us-standard/exponent-icon@2x.png' },
              3: { uri: 'https://s3.amazonaws.com/exp-us-standard/exponent-icon@3x.png' },
            }}
            style={styles.nuxLogo}
          />
          <Text style={headingStyles}>
            Welcome to Expo!
          </Text>
        </View>
        <Text style={styles.nuxTooltip}>
          {tooltipMessage}
        </Text>
        <TouchableOpacity
          style={styles.nuxButton}
          onPress={this._onPressFinishNux}>
          <Text style={styles.nuxButtonLabel}>
            Got it
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  _renderTaskInfoRow() {
    let { task } = this.props;
    let taskUrl;
    if (task.loadingError) {
      taskUrl = task.loadingError.originalUrl;
    } else {
      taskUrl = (task.manifestUrl) ? FriendlyUrls.toFriendlyString(task.manifestUrl) : '';
    }
    let iconUrl = task.manifest && task.manifest.get('iconUrl');
    let taskName = task.manifest && task.manifest.get('name');

    let icon = (iconUrl) ?
      <Image source={{uri: iconUrl}} style={styles.taskIcon} /> :
      <ResponsiveImage
        resizeMode="contain"
        sources={{
          2: { uri: 'https://s3.amazonaws.com/exp-us-standard/exponent-icon@2x.png' },
          3: { uri: 'https://s3.amazonaws.com/exp-us-standard/exponent-icon@3x.png' },
        }}
        style={styles.taskIcon}
      />
    let taskNameStyles = (taskName) ? styles.taskName : [styles.taskName, { color: '#c5c6c7' }];
    return (
      <View style={styles.taskMetaRow}>
        <View style={styles.taskIconColumn}>
          {icon}
        </View>
        <View style={styles.taskInfoColumn}>
          <Text style={taskNameStyles}>{(taskName) ? taskName : 'Untitled Experience'}</Text>
          <Text style={[styles.taskUrl]}>{taskUrl}</Text>
          {this._maybeRenderDevServerName()}
        </View>
      </View>
    );
  }

  _maybeRenderDevServerName() {
    let { task } = this.props;
    let devServerName = task.manifest.getIn(['developer', 'tool']);
    if (devServerName) {
      // XDE is upper
      if (devServerName === 'xde') {
        devServerName = devServerName.toUpperCase();
      }
      return (
        <View style={{flexDirection: 'row'}}>
          <DevIndicator style={{marginTop: 4.5, marginRight: 7}} />
          <Text style={styles.taskDevServerName}>{devServerName}</Text>
        </View>
      );
    }
    return null;
  }

  _maybeRenderDevMenuTools() {
    if (this.state.enableDevMenuTools && this.state.devMenuItems) {
      return (
        <View>
          <View style={styles.separator} />
          <View style={styles.buttonContainer}>
            {
              Object.keys(this.state.devMenuItems).map((key, idx) => {
                return this._renderDevMenuItem(key, this.state.devMenuItems[key]);
              })
            }
          </View>
        </View>
      );
    }
    return null;
  }

  _renderDevMenuItem(key, item) {
    let { label, isEnabled } = item;
    if (isEnabled) {
      return this._renderButton(key, label, () => { this._onPressDevMenuButton(key); }, null, true);
    } else {
      return (
        <View
          style={[styles.button, styles.buttonWithSeparator]}
          key={key}>
          <View style={styles.buttonIcon} />
          <Text style={[styles.buttonText, {color: '#9ca0a6'}]}>
            {label}
          </Text>
        </View>
      );
    }
  }

  _renderButton(key, text, onPress, iconSource, withSeparator) {
    let icon, buttonStyles;
    if (iconSource) {
      icon = (
        <Image
          style={styles.buttonIcon}
          source={iconSource} />
      );
    } else {
      icon = (
        <View style={styles.buttonIcon} />
      );
    }
    if (withSeparator) {
      buttonStyles = [styles.button, styles.buttonWithSeparator];
    } else {
      buttonStyles = styles.button;
    }
    return (
      <TouchableOpacity
        key={key}
        style={buttonStyles}
        onPress={onPress}>
        {icon}
        <Text style={styles.buttonText}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  }

  _onPressFinishNux = () => {
    ExStore.dispatch(BrowserActions.setIsNuxFinishedAsync(true));
    ExStore.dispatch(BrowserActions.showMenuAsync(false));
  }

  _onPressContainer = () => {
    if (this.props.isNuxFinished) {
      ExStore.dispatch(BrowserActions.showMenuAsync(false));
    }
  }

  _goToHome = () => {
    ExStore.dispatch(BrowserActions.foregroundHomeAsync());
  }

  _onPressDevMenuButton = (key) => {
    ExponentKernel.selectDevMenuItemWithKey(key);
    ExStore.dispatch(BrowserActions.showMenuAsync(false));
  }
}

let styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 24,
  },
  taskMetaRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  taskInfoColumn: {
    flex: 4,
  },
  taskIconColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskName: {
    color: '#595c68',
    backgroundColor: 'transparent',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 2,
  },
  taskUrl: {
    color: '#9ca0a6',
    backgroundColor: 'transparent',
    marginRight: 16,
    marginVertical: 4,
    fontSize: 14,
  },
  taskIcon: {
    width: 52,
    height: 52,
    marginTop: 12,
    marginRight: 16,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  taskDevServerName: {
    fontSize: 12,
    color: '#9ca0a6',
    fontWeight: '700'
  },
  separator: {
    borderColor: '#d5d6d7',
    borderTopWidth: 1 / PixelRatio.get(),
    backgroundColor: '#f0f0f1',
    height: 12,
    marginVertical: 4,
    marginHorizontal: -1,
  },
  buttonContainer: {
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
  },
  buttonWithSeparator: {
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: '#dadada',
  },
  buttonIcon: {
    width:16,
    height: 16,
    marginVertical: 12,
    marginLeft: 20,
    alignSelf:'flex-start'
  },
  buttonText: {
    color: '#595c68',
    fontSize: 14,
    textAlign: 'left',
    marginVertical: 12,
    paddingHorizontal: 12,
    fontWeight: '700',
  },
  nuxRow: {
    paddingHorizontal: 12,
  },
  nuxHeadingRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginRight: 16,
    marginBottom: 8,
  },
  nuxLogo: {
    width: 47 * 0.7,
    height: 40 * 0.7,
    marginRight: 12,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  nuxHeading: {
    flex: 1,
    color: '#595c68',
    fontWeight: '700',
    fontSize: 22,
  },
  nuxHeadingNarrow: {
    fontSize: 18,
    marginTop: 2,
  },
  nuxTooltip: {
    color: '#595c68',
    marginRight: 16,
    marginVertical: 4,
    fontSize: 16,
  },
  nuxButton: {
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 10,
    backgroundColor: '#056ecf',
    borderRadius: 3,
  },
  nuxButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
  },
});
