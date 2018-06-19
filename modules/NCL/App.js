// import './LegacyReact';

// import Expo, { Asset } from 'expo';
import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-navigation';

// workaround for large android status bar in react-nav beta.27
// if (Platform.OS === 'android') {
//   SafeAreaView.setStatusBarHeight(0);
// }

import Icons from './constants/Icons';
import RootNavigation from './navigation/RootNavigation';

export default class App extends React.Component {
  state = {
    appIsReady: false,
  };

  componentWillMount() {
    this._loadAssetsAsync();
  }

  async _loadAssetsAsync() {
    try {
      const iconRequires = Object.keys(Icons).map(key => Icons[key]);
      await Promise.all([
        // Asset.loadAsync(iconRequires),
        // Expo.Font.loadAsync({ 'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf') })
      ]);
    } catch (e) {
      console.log({ e });
    } finally {
      this.setState({ appIsReady: true });
    }
  }

  render() {
    // if (this.state.appIsReady) {
      return (
        <View style={styles.container} testID="native_component_list">
          <RootNavigation />

          {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        </View>
      );
    // } else {
    //   return <Expo.AppLoading />;
    // }
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
  },
});
