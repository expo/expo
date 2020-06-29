import { AppLoading } from 'expo';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
import { enableScreens } from 'react-native-screens';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...props: any[]) => {
    // Mute the warnings about react-native-web 11 for now.
    // This warning is thrown whenever ScrollView or TouchableWithoutFeedback are used.
    // Remove this after support for react-native-web@0.12 has landed.
    for (const message of props) {
      if (
        typeof message === 'string' &&
        message.includes(
          'has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles'
        )
      ) {
        return;
      }
    }
    originalWarn(...props);
  };
}

if (Platform.OS === 'android') {
  enableScreens(true);
}

export default function App(props: any) {
  const [isReady, setReady] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', false);
    }
    (async () => {
      try {
        await loadAssetsAsync();
      } catch (e) {
        console.log({ e });
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (isReady) {
    return (
      <AppearanceProvider>
        <RootNavigation {...props} />
      </AppearanceProvider>
    );
  }
  // We should check whether `AppLoading` is set, as this code may be used by `bare-expo`
  // where this module is not exported due to bare workflow.
  if (AppLoading) {
    return <AppLoading />;
  }
  return null;
}
