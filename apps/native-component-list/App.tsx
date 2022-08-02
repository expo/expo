import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import ThemeProvider from 'src/theme/ThemeProvider';

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
    await loadAssetsAsync();
  });

  return <ThemeProvider>{isLoadingCompleted ? <RootNavigation /> : null}</ThemeProvider>;
};

export default App;
