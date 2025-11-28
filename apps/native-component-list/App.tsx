import { ThemeProvider } from 'ThemeProvider';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Platform, StatusBar } from 'react-native';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';
import KeyboardRepro from './KeyboardRepro';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HostIgnoreSafeAreaInsetsScreen from 'src/screens/UI/HostIgnoreSafeAreaInsetsScreen.ios';

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
    <ThemeProvider>
      {isLoadingCompleted ? (
        <SafeAreaProvider style={{ flex: 1 }}>
          <KeyboardProvider>
            <HostIgnoreSafeAreaInsetsScreen />
          </KeyboardProvider>
        </SafeAreaProvider>
      ) : null}
    </ThemeProvider>
  );
}
