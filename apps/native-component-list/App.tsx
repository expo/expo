import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';

import { ThemeProvider, useTheme } from '../common/ThemeProvider';
import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

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

function AppContent() {
  const { name: themeName } = useTheme();
  const isLoadingCompleted = useSplashScreen(async () => {
    await loadAssetsAsync();
  });

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle(themeName === 'dark' ? 'light-content' : 'dark-content', true);
    }
  }, [themeName]);

  return isLoadingCompleted ? <RootNavigation /> : null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
