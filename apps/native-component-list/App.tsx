import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
import { enableScreens } from 'react-native-screens';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

if (Platform.OS === 'android') {
  enableScreens(true);
}

function useSplashScreen(loadingFunction: () => void | Promise<void>) {
  const [isLoadingCompleted, setLoadingComplete] = React.useState(false);

  // Load any resources or data that we need prior to rendering the app
  React.useEffect(() => {
    async function loadAsync() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await loadingFunction();
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadAsync();
  }, []);

  return isLoadingCompleted;
}

export default function App(props: any) {
  const isLoadingCompleted = useSplashScreen(async () => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', false);
    }
    await loadAssetsAsync();
  });

  if (!isLoadingCompleted) {
    return null;
  }

  return (
    <AppearanceProvider>
      <RootNavigation {...props} />
    </AppearanceProvider>
  );
}
