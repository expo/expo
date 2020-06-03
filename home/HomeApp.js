import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as Device from 'expo-device';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { Linking, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { Appearance } from 'react-native-appearance';
import { Assets as StackAssets } from 'react-navigation-stack';
import { connect } from 'react-redux';
import url from 'url';

import Navigation from './navigation/Navigation';
import HistoryActions from './redux/HistoryActions';
import SessionActions from './redux/SessionActions';
import SettingsActions from './redux/SettingsActions';
import Store from './redux/Store';
import LocalStorage from './storage/LocalStorage';
import addListenerWithNativeCallback from './utils/addListenerWithNativeCallback';

// Download and cache stack assets, don't block loading on this though
Asset.loadAsync(StackAssets);

@connect(data => App.getDataProps(data))
export default class App extends React.Component {
  static getDataProps({ settings }) {
    return {
      preferredAppearance: settings.preferredAppearance,
    };
  }

  state = {
    isReady: false,
    colorScheme: Appearance.getColorScheme(),
  };

  async componentDidMount() {
    this._initializeStateAsync();
    this._addProjectHistoryListener();
    await SplashScreen.preventAutoHideAsync();
  }

  _addProjectHistoryListener = () => {
    addListenerWithNativeCallback('ExponentKernel.addHistoryItem', async event => {
      let { manifestUrl, manifest, manifestString } = event;
      if (!manifest && manifestString) {
        manifest = JSON.parse(manifestString);
      }
      Store.dispatch(HistoryActions.addHistoryItem(manifestUrl, manifest));
    });
  };

  _isExpoHost = host => {
    return (
      host === 'exp.host' ||
      host === 'expo.io' ||
      host === 'exp.direct' ||
      host === 'expo.test' ||
      host.endsWith('.exp.host') ||
      host.endsWith('.expo.io') ||
      host.endsWith('.exp.direct') ||
      host.endsWith('.expo.test')
    );
  };

  _isThirdPartyHosted = urlToCheck => {
    if (!urlToCheck) {
      return false;
    }
    const urlComponents = url.parse(urlToCheck);
    const host = urlComponents.host;
    if (!host) {
      return false;
    }
    return !this._isExpoHost(host);
  };

  _initializeStateAsync = async () => {
    try {
      Store.dispatch(SettingsActions.loadSettings());
      Store.dispatch(HistoryActions.loadHistory());
      const storedSession = await LocalStorage.getSessionAsync();

      if (storedSession) {
        Store.dispatch(SessionActions.setSession(storedSession));
      }

      if (Platform.OS === 'ios') {
        await Promise.all([Font.loadAsync(Ionicons.font)]);
      } else {
        await Promise.all([Font.loadAsync(Ionicons.font), Font.loadAsync(MaterialIcons.font)]);
      }
    } catch (e) {
      // ..
    } finally {
      this.setState({ isReady: true }, async () => {
        await SplashScreen.hideAsync();
        if (Platform.OS === 'ios') {
          // if expo client is opened via deep linking, we'll get the url here
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            Linking.openURL(initialUrl);
          }
        }
      });
    }
  };

  render() {
    if (!this.state.isReady) {
      return null;
    }

    const { preferredAppearance, colorScheme } = this.props;
    let theme = preferredAppearance === 'no-preference' ? colorScheme : preferredAppearance;
    if (theme === 'no-preference') {
      theme = 'light';
    }

    const backgroundColor = theme === 'dark' ? '#000000' : '#ffffff';

    // Android below API 23 (Android 6.0) does not support 'dark-content' barStyle:
    // - statusBar shouldn't be translucent
    // - backgroundColor should be a color that would make status bar icons be visible
    const translucent = !(Platform.OS === 'android' && Device.platformApiLevel < 23);
    const statusBarBackgroundColor =
      theme === 'dark' ? '#000000' : translucent ? '#ffffff' : '#00000088';

    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActionSheetProvider>
          <Navigation theme={theme} />
        </ActionSheetProvider>

        <StatusBar
          translucent={translucent}
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={statusBarBackgroundColor}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
