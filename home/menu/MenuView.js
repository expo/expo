import React from 'react';
import {
  Alert,
  AppRegistry,
  Clipboard,
  Dimensions,
  Image,
  NativeModules,
  PixelRatio,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

import Expo, { Constants } from 'expo';
import ResponsiveImage from '@expo/react-native-responsive-image';

import DevIndicator from '../components/DevIndicator';
import FriendlyUrls from '../legacy/FriendlyUrls';
import requestCameraPermissionsAsync from '../utils/requestCameraPermissionsAsync';

const { ExponentKernel } = NativeModules;

let MENU_NARROW_SCREEN = Dimensions.get('window').width < 375;

export default class MenuView extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      enableDevMenuTools: false,
      devMenuItems: {},
      isNuxFinished: false,
      isLoading: false,
      isLoaded: false,
    };
  }

  async componentDidMount() {
    this._mounted = true;
    this.forceStatusBarUpdateAsync();
  }

  componentWillUnmount() {
    this.restoreStatusBar();
    this._mounted = false;
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.isLoading) {
      this._loadStateAsync();
    }
  }

  _loadStateAsync = async () => {
    this.setState({ isLoading: true, isLoaded: false }, async () => {
      const enableDevMenuTools = await ExponentKernel.doesCurrentTaskEnableDevtools();
      const devMenuItems = await ExponentKernel.getDevMenuItemsToShow();
      const isNuxFinished = await ExponentKernel.getIsNuxFinishedAsync();
      if (this._mounted) {
        this.setState({
          enableDevMenuTools,
          devMenuItems,
          isNuxFinished,
          isLoading: false,
          isLoaded: true,
        });
      }
    });
  };

  forceStatusBarUpdateAsync = async () => {
    if (NativeModules.StatusBarManager._captureProperties) {
      this._statusBarValuesToRestore = await NativeModules.StatusBarManager._captureProperties();
      // HACK: StatusBar only updates changed props.
      // because MenuView typically lives under a different RN bridge, its stack of StatusBar
      // props does not necessarily reflect what the user is seeing.
      // so we force StatusBar to clear its state and update all props when we mount.
      StatusBar._currentValues = null;
    }
  };
  restoreStatusBar = () => {
    if (
      NativeModules.StatusBarManager._applyPropertiesAndForget &&
      this._statusBarValuesToRestore
    ) {
      NativeModules.StatusBarManager._applyPropertiesAndForget(this._statusBarValuesToRestore);
    }
  };
  render() {
    if (!this.state.isLoaded) {
      return <View />;
    }

    let copyUrlButton;
    if (this.props.task && this.props.task.manifestUrl) {
      copyUrlButton = this._renderButton({
        key: 'copy',
        text: 'Copy Link',
        onPress: this._copyTaskUrl,
        iconSource: require('../assets/ios-menu-copy.png'),
      });
    }

    const screenStyles = {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    };

    return (
      <View style={[styles.container, screenStyles]}>
        <StatusBar barStyle="default" />
        <ScrollView style={styles.overlay}>
          {this.state.isNuxFinished ? this._renderTaskInfoRow() : this._renderNUXRow()}
          <View style={styles.separator} />
          <View style={styles.buttonContainer}>
            {this._renderButton({
              key: 'refresh',
              text: 'Refresh',
              onPress: () => ExponentKernel.selectRefresh(),
              iconSource: require('../assets/ios-menu-refresh.png'),
            })}
            {copyUrlButton}
            {this._renderButton({
              key: 'home',
              text: 'Go to Expo Home',
              onPress: this._goToHome,
              iconSource: require('../assets/ios-menu-home.png'),
            })}
          </View>
          {this._maybeRenderDevMenuTools()}
          <TouchableHighlight
            style={styles.closeButton}
            onPress={this._onPressClose}
            underlayColor="#eee"
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Image
              source={require('../assets/menu-md-close.png')}
              style={{ width: 12, height: 20 }}
            />
          </TouchableHighlight>
        </ScrollView>
      </View>
    );
  }

  _renderNUXRow() {
    let tooltipMessage;
    if (Expo.Constants.isDevice) {
      tooltipMessage = 'Shake your device to show this menu.';
    } else {
      tooltipMessage = 'In iPhone Simulator, press \u2318D to show this menu.';
    }
    let headingStyles = MENU_NARROW_SCREEN
      ? [styles.nuxHeading, styles.nuxHeadingNarrow]
      : styles.nuxHeading;
    return (
      <View style={styles.nuxRow}>
        <View style={styles.nuxHeadingRow}>
          <ResponsiveImage
            sources={{
              2: {
                uri: 'https://s3.amazonaws.com/exp-us-standard/exponent-icon@2x.png',
              },
              3: {
                uri: 'https://s3.amazonaws.com/exp-us-standard/exponent-icon@3x.png',
              },
            }}
            style={styles.nuxLogo}
          />
          <Text style={headingStyles}>Welcome to Expo!</Text>
        </View>
        <Text style={styles.nuxTooltip}>{tooltipMessage}</Text>
        <TouchableOpacity style={styles.nuxButton} onPress={this._onPressFinishNux}>
          <Text style={styles.nuxButtonLabel}>Got it</Text>
        </TouchableOpacity>
      </View>
    );
  }

  _renderTaskInfoRow() {
    let { task } = this.props;
    let taskUrl;
    taskUrl = task.manifestUrl ? FriendlyUrls.toFriendlyString(task.manifestUrl) : '';

    let iconUrl = task.manifest && task.manifest.iconUrl;
    let taskName = task.manifest && task.manifest.name;

    let icon = iconUrl ? (
      <Image source={{ uri: iconUrl }} style={styles.taskIcon} />
    ) : (
      <ResponsiveImage
        resizeMode="contain"
        sources={{
          2: {
            uri: 'https://s3.amazonaws.com/exp-us-standard/exponent-icon@2x.png',
          },
          3: {
            uri: 'https://s3.amazonaws.com/exp-us-standard/exponent-icon@3x.png',
          },
        }}
        style={styles.taskIcon}
      />
    );
    let taskNameStyles = taskName ? styles.taskName : [styles.taskName, { color: '#c5c6c7' }];
    return (
      <View style={styles.taskMetaRow}>
        <View style={styles.taskIconColumn}>{icon}</View>
        <View style={styles.taskInfoColumn}>
          <Text style={taskNameStyles} numberOfLines={1}>
            {taskName ? taskName : 'Untitled Experience'}
          </Text>
          <Text style={[styles.taskUrl]} numberOfLines={1}>
            {taskUrl}
          </Text>
          {this._maybeRenderDevServerName()}
        </View>
      </View>
    );
  }

  _maybeRenderDevServerName() {
    let { task } = this.props;
    let devServerName =
      task.manifest && task.manifest.developer ? task.manifest.developer.tool : null;
    if (devServerName) {
      // XDE is upper
      if (devServerName === 'xde') {
        devServerName = devServerName.toUpperCase();
      }
      return (
        <View style={{ flexDirection: 'row' }}>
          <DevIndicator style={{ marginTop: 4.5, marginRight: 7 }} />
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
            {Object.keys(this.state.devMenuItems).map(key => {
              return this._renderDevMenuItem(key, this.state.devMenuItems[key]);
            })}
          </View>
        </View>
      );
    }
    return null;
  }

  _renderDevMenuItem(key, item) {
    let { label, isEnabled, detail } = item;
    if (isEnabled) {
      return this._renderButton({
        key,
        text: label,
        onPress: () => {
          this._onPressDevMenuButton(key);
        },
        iconSource: null,
        withSeperator: true,
      });
    } else {
      const detailButton = detail ? this._renderDevMenuDetailButton(label, detail) : null;
      return (
        <View style={[styles.button, styles.buttonWithSeparator]} key={key}>
          <View style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: '#9ca0a6' }]}>{label}</Text>
          {detailButton}
        </View>
      );
    }
  }

  _renderDevMenuDetailButton(title, detail) {
    return (
      <TouchableOpacity
        onPress={() => {
          Alert.alert(title, detail);
        }}>
        <Image
          style={{ width: 16, height: 20, marginVertical: 10 }}
          source={require('../assets/ios-menu-information-circle.png')}
        />
      </TouchableOpacity>
    );
  }

  _renderButton(options) {
    const { key, text, onPress, iconSource, withSeparator } = options;

    let icon;
    if (iconSource) {
      icon = <Image style={styles.buttonIcon} source={iconSource} />;
    } else {
      icon = <View style={styles.buttonIcon} />;
    }

    const buttonStyles = withSeparator
      ? [styles.button, styles.buttonWithSeparator]
      : styles.button;

    return (
      <TouchableOpacity key={key} style={buttonStyles} onPress={onPress}>
        {icon}
        <Text style={styles.buttonText}>{text}</Text>
      </TouchableOpacity>
    );
  }

  _onOpenQRCode = async () => {
    if (await requestCameraPermissionsAsync()) {
      ExponentKernel.selectQRReader();
    } else {
      alert('In order to use the QR Code scanner you need to provide camera permissions');
    }
  };

  _onPressFinishNux = () => {
    ExponentKernel.setIsNuxFinishedAsync(true);
    ExponentKernel.selectCloseMenu();
  };

  _onPressClose = () => {
    ExponentKernel.selectCloseMenu();
  };

  _goToHome = () => {
    ExponentKernel.selectGoToHome();
  };

  _copyTaskUrl = () => {
    Clipboard.setString(this.props.task.manifestUrl);
  };

  _onPressDevMenuButton = key => {
    ExponentKernel.selectDevMenuItemWithKey(key);
  };
}

let styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: Constants.statusBarHeight,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
  },
  taskMetaRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  taskInfoColumn: {
    flex: 4,
    justifyContent: 'center',
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
    marginTop: 14,
    marginBottom: 1,
    marginRight: 24,
  },
  taskUrl: {
    color: '#9ca0a6',
    backgroundColor: 'transparent',
    marginRight: 16,
    marginBottom: 2,
    marginTop: 1,
    fontSize: 12,
  },
  taskIcon: {
    width: 52,
    height: 52,
    marginTop: 12,
    marginRight: 10,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  taskDevServerName: {
    fontSize: 12,
    color: '#9ca0a6',
    fontWeight: '700',
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
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#f4f4f5',
  },
  buttonIcon: {
    width: 16,
    height: 16,
    marginVertical: 12,
    marginLeft: 20,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#595c68',
    fontSize: 14,
    textAlign: 'left',
    marginVertical: 12,
    marginRight: 5,
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

AppRegistry.registerComponent('HomeMenu', () => MenuView);
