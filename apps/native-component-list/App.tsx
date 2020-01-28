import * as React from 'react';
import { AppLoading } from 'expo';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { AppearanceProvider, useColorScheme, ColorSchemeName } from 'react-native-appearance';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

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
  return (
    <AppearanceProvider>
      <App colorScheme={colorScheme} />
    </AppearanceProvider>
  );
}

class App extends React.Component<Props, State> {
  readonly state: State = initialState;

  componentDidMount() {
    this._loadAssetsAsync();
  }

  async _loadAssetsAsync() {
    try {
      await loadAssetsAsync();
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
    }
    // We should check whether `AppLoading` is set, as this code may be used by `bare-expo`
    // where this module is not exported due to bare workflow.
    if (AppLoading) {
      return <AppLoading />;
    }
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
