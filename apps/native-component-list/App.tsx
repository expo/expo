import { ThemeProvider } from 'ThemeProvider';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';
import { Host, HStack, Text } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';

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
    3;
    await loadAssetsAsync();
  });

  return (
    <Host style={{ backgroundColor: 'red', maxWidth: 200 }}>
      <Text>Hello</Text>
    </Host>
  );
}
