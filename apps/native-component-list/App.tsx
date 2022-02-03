import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

function useSplashScreen(loadingFunction: () => void) {
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
        await SplashScreen.hideAsync();
      }
    }

    loadAsync();
  }, []);

  return isLoadingCompleted;
}

const App = () => {
  const isLoadingCompleted = useSplashScreen(async () => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', false);
    }
    await loadAssetsAsync();
  });

  return isLoadingCompleted ? (
    <AppearanceProvider>
      <RootNavigation />
    </AppearanceProvider>
  ) : null;
};

export default App;
