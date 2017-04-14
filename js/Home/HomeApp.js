/* @flow */

import { Asset, Font } from 'expo';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { NavigationProvider, StackNavigation } from '@expo/ex-navigation';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import AuthTokenActions from '../Flux/AuthTokenActions';
import BrowserActions from '../Flux/BrowserActions';
import LocalStorage from '../Storage/LocalStorage';
import GlobalLoadingOverlay from './containers/GlobalLoadingOverlay';
import ExStore from '../Flux/ExStore';

import Router from './navigation/Router';
import customNavigationContext from './navigation/customNavigationContext';

function cacheImages(images) {
  return images.map(image => Asset.fromModule(image).downloadAsync());
}

export default class AppContainer extends React.Component {
  state = {
    isReady: false,
  };

  componentDidMount() {
    this._initializeStateAsync();
  }

  _initializeStateAsync = async () => {
    try {
      ExStore.dispatch(BrowserActions.loadHistoryAsync());
      let storedAuthTokens = await LocalStorage.getAuthTokensAsync();

      if (storedAuthTokens) {
        ExStore.dispatch(AuthTokenActions.setAuthTokens(storedAuthTokens));
      }

      if (Platform.OS === 'ios') {
        let imageAssets = [
          require('../Assets/ios-menu-refresh.png'),
          require('../Assets/ios-menu-home.png'),
        ];

        await Promise.all([
          ...cacheImages(imageAssets),
          Font.loadAsync(Ionicons.font),
        ]);
      } else {
        await Promise.all([
          Font.loadAsync(Ionicons.font),
          Font.loadAsync(MaterialIcons.font),
        ]);
      }
    } catch (e) {
      // ..
    } finally {
      this.setState({ isReady: true });
    }
  };

  render() {
    if (!this.state.isReady) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ActionSheetProvider>
          <NavigationProvider context={customNavigationContext}>
            {this.state.isReady &&
              <StackNavigation id="root" initialRoute="rootNavigation" />}
          </NavigationProvider>
        </ActionSheetProvider>

        {Platform.OS === 'ios' && <GlobalLoadingOverlay />}
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
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
