import { AppLoading, Asset, Constants, Font } from 'expo';
import React from 'react';
import { ActivityIndicator, Linking, Platform, StatusBar, StyleSheet, View } from 'react-native';
import url from 'url';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import jwtDecode from 'jwt-decode';
import Navigation from './navigation/Navigation';
import HistoryActions from './redux/HistoryActions';
import SessionActions from './redux/SessionActions';
import SettingsActions from './redux/SettingsActions';
import LocalStorage from './storage/LocalStorage';
import MenuView from './menu/MenuView';
import Store from './redux/Store';

import addListenerWithNativeCallback from './utils/addListenerWithNativeCallback';
import getViewerUsernameAsync from './utils/getViewerUsernameAsync';

function cacheImages(images) {
  return images.map(image => Asset.fromModule(image).downloadAsync());
}

export default class App extends React.Component {
  state = {
    isReady: false,
  };

  componentDidMount() {
    this._initializeStateAsync();
    addListenerWithNativeCallback(
      'ExponentKernel.getIsValidHomeManifestToOpen',
      this._getIsValidHomeManifestToOpen
    );
  }

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

  _getIsValidHomeManifestToOpen = async event => {
    const { manifest, manifestUrl } = event;
    let isValid = false;
    if (!Constants.isDevice) {
      // simulator has no restriction
      isValid = true;
    } else if (this._isThirdPartyHosted(manifestUrl)) {
      // TODO(quin): figure out a long term solution for this
      // allow self hosted applications to be loaded into the client
      isValid = true;
    } else if (manifest) {
      if (manifest.developer && manifest.developer.tool) {
        isValid = true;
      } else if (manifest.slug === 'snack') {
        isValid = true;
      } else if (manifest.id) {
        try {
          let manifestAuthorComponents = manifest.id.split('/');
          let manifestAuthor = manifestAuthorComponents[0].substring(1);

          let username = await getViewerUsernameAsync();

          if (username && manifestAuthor && manifestAuthor === username) {
            isValid = true;
          }
        } catch (_) {}
      }
    }
    return { isValid };
  };

  _initializeStateAsync = async () => {
    try {
      Store.dispatch(SettingsActions.loadSettings());
      Store.dispatch(HistoryActions.loadHistory());
      await LocalStorage.migrateNuxStateToNativeAsync();
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
        if (Platform.OS == 'ios') {
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
      return <AppLoading />;
    }

    return (
      <View style={styles.container}>
        <ActionSheetProvider>
          <Navigation />
        </ActionSheetProvider>

        {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        {Platform.OS === 'android' && <View style={styles.statusBarUnderlay} />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBarUnderlay: {
    height: Constants.statusBarHeight,
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
