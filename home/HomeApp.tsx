import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Assets as StackAssets } from '@react-navigation/stack';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useColorScheme } from 'react-native-appearance';
import url from 'url';

import { ColorTheme } from './constants/Colors';
import Navigation from './navigation/Navigation';
import HistoryActions from './redux/HistoryActions';
import { useDispatch, useSelector } from './redux/Hooks';
import SessionActions from './redux/SessionActions';
import SettingsActions from './redux/SettingsActions';
import LocalStorage from './storage/LocalStorage';
import * as UrlUtils from './utils/UrlUtils';
import addListenerWithNativeCallback from './utils/addListenerWithNativeCallback';

// Download and cache stack assets, don't block loading on this though
Asset.loadAsync(StackAssets);

function useSplashScreenWhileLoadingResources(loadResources: () => Promise<void>) {
  const [isSplashScreenShown, setSplashScreenShown] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      // await SplashScreen.preventAutoHideAsync(); // this is called in App (main component of the application)
      await loadResources();
      setSplashScreenShown(false);
    })();
  }, []);
  React.useEffect(() => {
    (async () => {
      if (!isSplashScreenShown) {
        await SplashScreen.hideAsync();
      }
    })();
  }, [isSplashScreenShown]);

  return isSplashScreenShown;
}

export default function HomeApp() {
  const colorScheme = useColorScheme();
  const preferredAppearance = useSelector((data) => data.settings.preferredAppearance);
  const dispatch = useDispatch();

  const isShowingSplashScreen = useSplashScreenWhileLoadingResources(async () => {
    await initStateAsync();
  });

  React.useEffect(() => {
    addProjectHistoryListener();
  }, []);

  React.useEffect(() => {
    if (!isShowingSplashScreen && Platform.OS === 'ios') {
      // If Expo Go is opened via deep linking, we'll get the URL here
      Linking.getInitialURL().then((initialUrl) => {
        if (initialUrl && shouldOpenUrl(initialUrl)) {
          Linking.openURL(UrlUtils.toExp(initialUrl));
        }
      });
    }
  }, [isShowingSplashScreen]);

  const addProjectHistoryListener = () => {
    addListenerWithNativeCallback('ExponentKernel.addHistoryItem', async (event) => {
      let { manifestUrl, manifest, manifestString } = event;
      if (!manifest && manifestString) {
        manifest = JSON.parse(manifestString);
      }
      dispatch(HistoryActions.addHistoryItem(manifestUrl, manifest));
    });
  };

  const initStateAsync = async () => {
    try {
      dispatch(SettingsActions.loadSettings());
      dispatch(HistoryActions.loadHistory());

      const storedSession = await LocalStorage.getSessionAsync();

      if (storedSession) {
        dispatch(SessionActions.setSession(storedSession));
      }

      if (Platform.OS === 'ios') {
        await Promise.all([Font.loadAsync(Ionicons.font)]);
      } else {
        await Promise.all([Font.loadAsync(Ionicons.font), Font.loadAsync(MaterialIcons.font)]);
      }
    } finally {
      return;
    }
  };

  if (isShowingSplashScreen) {
    return null;
  }

  let theme = preferredAppearance === 'no-preference' ? colorScheme : preferredAppearance;
  if (theme === 'no-preference') {
    theme = 'light';
  }

  const backgroundColor = theme === 'dark' ? '#000000' : '#ffffff';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ActionSheetProvider>
        <Navigation theme={theme === 'light' ? ColorTheme.LIGHT : ColorTheme.DARK} />
      </ActionSheetProvider>
    </View>
  );
}

// Certain links (i.e. 'expo.dev/expo-go') should just open the HomeScreen
function shouldOpenUrl(urlString: string) {
  const parsedUrl = url.parse(urlString);
  return !(
    (parsedUrl.hostname === 'expo.io' || parsedUrl.hostname === 'expo.dev') &&
    parsedUrl.pathname === '/expo-go'
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
