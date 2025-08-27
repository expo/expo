import { ThemeProvider } from 'ThemeProvider';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform, StatusBar, Text } from 'react-native';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

import { ExpoCssView } from './modules/expo-css-view';

SplashScreen.preventAutoHideAsync();

function useSplashScreen(loadingFunction: () => Promise<void>) {
  const [isLoadingCompleted, setLoadingComplete] = React.useState(false);

  // Load any resources or data that we need prior to rendering the app
  React.useEffect(() => {
    async function loadAsync() {
      try {
        await loadingFunction();
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        await SplashScreen.hide();
      }
    }

    loadAsync();
  }, []);

  return isLoadingCompleted;
}

export default function App() {
  const isLoadingCompleted = useSplashScreen(async () => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', false);
    }
    await loadAssetsAsync();
  });

  return (
    <ExpoCssView
      style={{
        width: 100,
        height: 100,
        experimental_backgroundImage: 'linear-gradient(to right, red, blue)',
        filter: 'blur(10px);grayscale(1)',
      }}
    />
  );
}
