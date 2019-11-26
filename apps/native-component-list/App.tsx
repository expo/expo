import * as React from 'react';
import { AppLoading } from 'expo';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { Assets as StackAssets } from 'react-navigation-stack';
import { enableScreens } from 'react-native-screens';
import { AppearanceProvider, useColorScheme, ColorSchemeName } from 'react-native-appearance';

import Icons from './src/constants/Icons';
import RootNavigation from './src/navigation/RootNavigation';

if (Platform.OS === 'android') {
  enableScreens(true);
}

const initialState = {
  appIsReady: false,
};

type Props = { colorScheme: ColorSchemeName };
type State = typeof initialState;

export default function AppContainer() {
  let colorScheme = useColorScheme();
  return <AppearanceProvider><App colorScheme={colorScheme} /></AppearanceProvider>
}

class App extends React.Component<Props, State> {
  readonly state: State = initialState;

  componentDidMount() {
    this._loadAssetsAsync();
  }

  async _loadAssetsAsync() {
    try {
      const iconRequires = Object.keys(Icons).map(key => Icons[key]);
      await Promise.all([
        Asset.loadAsync(iconRequires),
        Asset.loadAsync(StackAssets),
        // @ts-ignore
        Font.loadAsync(Ionicons.font),
        // @ts-ignore
        Font.loadAsync(Entypo.font),
        // @ts-ignore
        Font.loadAsync(MaterialIcons.font),
        Font.loadAsync({
          'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
        }),
        Font.loadAsync({
          Roboto: 'https://github.com/google/fonts/raw/master/apache/roboto/Roboto-Regular.ttf',
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
          <RootNavigation />
          {Platform.OS === 'ios' && <StatusBar barStyle="dark-content" />}
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
});
