import { AppLoading } from 'expo';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
import { enableScreens } from 'react-native-screens';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

if (Platform.OS === 'android') {
  enableScreens(true);
}

export default function AppContainer() {
  return (
    <AppearanceProvider>
      <App />
    </AppearanceProvider>
  );
}

function App(props: any) {
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
    return <RootNavigation {...props} />;
  }
  // We should check whether `AppLoading` is set, as this code may be used by `bare-expo`
  // where this module is not exported due to bare workflow.
  if (AppLoading) {
    return <AppLoading />;
  }
  return null;
}
