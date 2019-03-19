import * as React from 'react';
import { AppLoading, Asset, Font } from 'expo';
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { Assets as StackAssets } from 'react-navigation-stack';
import { useScreens } from 'react-native-screens';

import Icons from './src/constants/Icons';
import RootNavigation from './src/navigation/RootNavigation';

// workaround for large android status bar in react-nav beta.27
if (Platform.OS === 'android') {
  useScreens();
  SafeAreaView.setStatusBarHeight(0);
}

const initialState = {
  appIsReady: false,
};

type State = typeof initialState;

export default class App extends React.Component<{}, State> {
  readonly state: State = initialState;

  componentWillMount() {
    this._loadAssetsAsync();
  }

  async _loadAssetsAsync() {
    try {
      const iconRequires = Object.keys(Icons).map(key => Icons[key]);
      await Promise.all([
        Asset.loadAsync(iconRequires),
        Asset.loadAsync(StackAssets),
        Font.loadAsync(Ionicons.font),
        Font.loadAsync(Entypo.font),
        Font.loadAsync(MaterialIcons.font),
        Font.loadAsync({
          'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
        }),
      ]);
    } catch (e) {
      console.log({ e });
    } finally {
      this.setState({ appIsReady: true });
    }
  }

  render() {
    if (this.state.appIsReady) {
      return (
        <View style={styles.container} testID="native_component_list">
          {Platform.OS === 'android' && (
            <View style={styles.statusBarUnderlay} />
          )}
          <RootNavigation />
          {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        </View>
      );
    } else {
      return <AppLoading />;
    }
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
