import { ThemeProvider } from 'ThemeProvider';
import { useBackgroundTaskPluginClient } from 'expo-background-task';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';
import { optionalRequire } from 'src/navigation/routeBuilder';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

SplashScreen.preventAutoHideAsync();

// Require the `BackgroundTaskScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() => require('native-component-list/src/screens/BackgroundTaskScreen'));

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
  useBackgroundTaskPluginClient();
  const isLoadingCompleted = useSplashScreen(async () => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', false);
    }
    await loadAssetsAsync();
  });

  return <ThemeProvider>{isLoadingCompleted ? <RootNavigation /> : null}</ThemeProvider>;
}
