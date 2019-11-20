import Constants from 'expo-constants';
import React from 'react';
import {
  Animated,
  AppRegistry,
  Clipboard,
  Dimensions,
  Image,
  NativeModules,
  PixelRatio,
  StatusBar,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemeContext } from 'react-navigation';

import { AppearanceProvider, useColorScheme } from 'react-native-appearance';
import DevIndicator from '../components/DevIndicator';
import * as Kernel from '../kernel/Kernel';
import FriendlyUrls from '../legacy/FriendlyUrls';
import requestCameraPermissionsAsync from '../utils/requestCameraPermissionsAsync';
import { StyledView, StyledScrollView } from '../components/Views';
import { StyledText } from '../components/Text';
import LocalStorage from '../storage/LocalStorage';

let MENU_NARROW_SCREEN = Dimensions.get('window').width < 375;

// These are defined in EXVersionManager.m in a dictionary, ordering needs to be
// done here.
const DEV_MENU_ORDER = [
  'dev-live-reload',
  'dev-hmr',
  'dev-remote-debug',
  'dev-reload',
  'dev-perf-monitor',
  'dev-inspector',
];

class MenuView extends React.Component {
  _scrollPosition = new Animated.Value(0);

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

  // NOTE(brentvatne): moving this to didmount, didupdate, or constructor does not work
  UNSAFE_componentWillReceiveProps() {
    if (!this.state.isLoading) {
      this._loadStateAsync();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.visible && !this.props.visible) {
      this.restoreStatusBar();
    } else if (!prevProps.visible && this.props.visible) {
      this.forceStatusBarUpdateAsync();
      this._scrollPosition.setValue(0);
    }
  }

  _loadStateAsync = async () => {
    this.setState({ isLoading: true, isLoaded: false }, async () => {
      const enableDevMenuTools = await Kernel.doesCurrentTaskEnableDevtoolsAsync();
      const devMenuItems = await Kernel.getDevMenuItemsToShowAsync();
      const isNuxFinished = await Kernel.isNuxFinishedAsync();
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

  _handleScroll = ({ nativeEvent }) => {
    let y = nativeEvent.contentOffset.y;
    this._scrollPosition.setValue(y);
    if (y <= -150) {
      this._onPressClose();
    }
  };

  render() {
    if (!this.state.isLoaded) {
      return <View />;
    }

    let copyUrlButton;
    if (this.props.task && this.props.task.manifestUrl) {
      copyUrlButton = (
        <MenuButton
          key="copy"
          label="Copy link to clipboard"
          onPress={this._copyTaskUrl}
          iconSource={require('../assets/ios-menu-copy.png')}
        />
      );
    }

    const screenStyles = {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    };

    const { theme } = this.props;

    let opacity = this._scrollPosition.interpolate({
      inputRange: [-150, 0, 1],
      outputRange: [0.5, 1, 1],
    });

    return (
      <StyledView style={[styles.container, screenStyles]} darkBackgroundColor="#000">
        <Animated.View style={{ flex: 1, opacity }}>
          <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
          <StyledScrollView
            style={styles.overlay}
            onScroll={this._handleScroll}
            scrollEventThrottle={16}>
            {this.state.isNuxFinished ? this._renderTaskInfoRow() : this._renderNUXRow()}
            <StyledView style={styles.separator} />
            <View style={styles.buttonContainer}>
              <MenuButton
                key="reload"
                label="Reload"
                onPress={Kernel.selectRefresh}
                iconSource={require('../assets/ios-menu-refresh.png')}
              />
              {copyUrlButton}
              <MenuButton
                key="home"
                label="Go to Home"
                onPress={this._goToHome}
                iconSource={require('../assets/ios-menu-home.png')}
              />
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
          </StyledScrollView>
        </Animated.View>
      </StyledView>
    );
  }

  _renderNUXRow() {
    let tooltipMessage;
    if (Constants.isDevice) {
      tooltipMessage =
        'Since this is your first time opening the Expo client, we wanted to show you this menu and let you know that you can shake your device to get back to it at any time.';
    } else {
      tooltipMessage =
        'Since this is your first time opening the Expo client, we wanted to show you this menu and let you know that in an iOS Simulator you can press \u2318D to get back to it at any time.';
    }
    let headingStyles = MENU_NARROW_SCREEN
      ? [styles.nuxHeading, styles.nuxHeadingNarrow]
      : styles.nuxHeading;
    return (
      <View style={styles.nuxRow}>
        <View style={styles.nuxHeadingRow}>
          <StyledText style={headingStyles} lightColor="#595c68">
            Hello there, friend! 👋
          </StyledText>
        </View>
        <StyledText style={styles.nuxTooltip} lightColor="#595c68">
          {tooltipMessage}
        </StyledText>
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
      <View style={[styles.taskIcon, { backgroundColor: '#eee' }]} />
    );
    let taskNameStyles = taskName ? styles.taskName : [styles.taskName, { color: '#c5c6c7' }];
    return (
      <View style={styles.taskMetaRow}>
        <View style={styles.taskIconColumn}>{icon}</View>
        <View style={styles.taskInfoColumn}>
          <StyledText style={taskNameStyles} numberOfLines={1} lightColor="#595c68">
            {taskName ? taskName : 'Untitled Experience'}
          </StyledText>
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
    let devMenuItems = Object.keys(this.state.devMenuItems).sort(
      (a, b) => DEV_MENU_ORDER.indexOf(a) > DEV_MENU_ORDER.indexOf(b)
    );

    if (this.state.enableDevMenuTools && this.state.devMenuItems) {
      return (
        <View>
          <StyledView style={styles.separator} />
          <View style={styles.buttonContainer}>
            {devMenuItems.map(key => {
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
    return (
      <MenuButton
        key={key}
        label={label}
        onPress={() => this._onPressDevMenuButton(key)}
        iconSource={null}
        withSeparator={false}
        isEnabled={isEnabled}
        detail={detail}
      />
    );
  }

  _onOpenQRCode = async () => {
    if (await requestCameraPermissionsAsync()) {
      Kernel.selectQRReader();
    } else {
      alert('In order to use the QR Code scanner you need to provide camera permissions');
    }
  };

  _onPressFinishNux = () => {
    Kernel.setNuxFinishedAsync(true);
    Kernel.selectCloseMenu();
  };

  _onPressClose = () => {
    Kernel.selectCloseMenu();
  };

  _goToHome = () => {
    Kernel.selectGoToHome();
  };

  _copyTaskUrl = () => {
    Clipboard.setString(this.props.task.manifestUrl);
  };

  _onPressDevMenuButton = key => {
    Kernel.selectDevMenuItemWithKey(key);
  };
}

function MenuDetailButton({ label, detail, onPress }) {
  if (!detail) {
    return null;
  }

  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 30, left: 30, bottom: 30, right: 30 }}>
      <Image
        style={{ width: 16, height: 20, marginLeft: -8, marginVertical: 10 }}
        source={require('../assets/ios-menu-information-circle.png')}
      />
    </TouchableOpacity>
  );
}

const LabelNameOverrides = {
  'Reload JS Bundle': 'Reload JS Bundle only',
};

function MenuButton({ label, onPress, iconSource, withSeparator, isEnabled, detail }) {
  if (typeof isEnabled === 'undefined') {
    isEnabled = true;
  }

  if (LabelNameOverrides[label]) {
    label = LabelNameOverrides[label];
  }

  let [showDetails, setShowDetails] = React.useState(true);

  let icon;
  if (iconSource) {
    icon = <Image style={styles.buttonIcon} source={iconSource} />;
  } else {
    icon = <View style={styles.buttonIcon} />;
  }

  if (isEnabled) {
    const buttonStyles = withSeparator
      ? [styles.button, styles.buttonWithSeparator]
      : styles.button;

    return (
      <TouchableOpacity style={buttonStyles} onPress={onPress}>
        {icon}
        <StyledText style={styles.buttonText} lightColor="#595c68">
          {label}
        </StyledText>
      </TouchableOpacity>
    );
  } else {
    return (
      <StyledView style={[styles.button, { flexDirection: 'column' }]}>
        <View style={{ flexDirection: 'row' }}>
          <View style={styles.buttonIcon} />
          <StyledText
            style={styles.buttonText}
            lightColor="#9ca0a6"
            darkColor="rgba(255,255,255,0.7)">
            {label}
          </StyledText>
          {/* We may want to use a button to conceal details in the future if we have more options
          <MenuDetailButton
            detail={detail}
            label={label}
            onPress={() => setShowDetails(!showDetails)}
          /> */}
        </View>
        {showDetails ? (
          <View style={{ flexDirection: 'row' }}>
            <View style={[styles.buttonIcon, { marginTop: -5, marginBottom: 15 }]} />
            <StyledText
              style={[
                styles.buttonText,
                { marginTop: -5, marginBottom: 15, fontWeight: 'normal', marginRight: 15, flex: 1 },
              ]}
              darkColor="rgba(255,255,255,0.7)"
              lightColor="#9ca0a6">
              {detail ? detail : 'Only available in development mode'}
            </StyledText>
          </View>
        ) : null}
      </StyledView>
    );
  }
}

function useUserSettings(renderId) {
  let [settings, setSettings] = React.useState({});

  React.useEffect(() => {
    async function getUserSettings() {
      let settings = await LocalStorage.getSettingsAsync();
      setSettings(settings);
    }

    getUserSettings();
  }, [renderId]);

  return settings;
}

const HomeMenu = props => {
  let colorScheme = useColorScheme();
  let { preferredAppearance = 'no-preference' } = useUserSettings(props.uuid);

  let theme = preferredAppearance === 'no-preference' ? colorScheme : preferredAppearance;
  if (theme === 'no-preference') {
    theme = 'light';
  }

  return (
    <AppearanceProvider>
      <ThemeContext.Provider value={theme}>
        <MenuView {...props} theme={theme} />
      </ThemeContext.Provider>
    </AppearanceProvider>
  );
};

let styles = StyleSheet.create({
  container: {},
  overlay: {
    flex: 1,
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
    borderTopWidth: 1 / PixelRatio.get(),
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
  },
  buttonIcon: {
    width: 16,
    height: 16,
    marginVertical: 12,
    marginLeft: 20,
    alignSelf: 'flex-start',
  },
  buttonText: {
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
    fontWeight: '700',
    fontSize: 22,
  },
  nuxHeadingNarrow: {
    fontSize: 18,
    marginTop: 2,
  },
  nuxTooltip: {
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
    color: '#fff',
    fontSize: 16,
  },
});

AppRegistry.registerComponent('HomeMenu', () => HomeMenu);
