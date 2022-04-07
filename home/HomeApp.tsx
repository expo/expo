import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { darkTheme, lightTheme } from '@expo/styleguide-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import MaterialIcons from '@expo/vector-icons/build/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Assets as StackAssets } from '@react-navigation/stack';
import { Asset } from 'expo-asset';
import { ThemePreference, ThemeProvider } from 'expo-dev-client-components';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Linking, Platform, StyleSheet, View, useColorScheme } from 'react-native';
import url from 'url';

import ApolloClient from './api/ApolloClient';
import { ColorTheme } from './constants/Colors';
import {
  HomeScreenDataDocument,
  HomeScreenDataQuery,
  HomeScreenDataQueryVariables,
  Home_CurrentUserDocument,
  Home_CurrentUserQuery,
  Home_CurrentUserQueryVariables,
} from './graphql/types';
import Navigation from './navigation/Navigation';
import HistoryActions from './redux/HistoryActions';
import { useDispatch, useSelector } from './redux/Hooks';
import SessionActions from './redux/SessionActions';
import SettingsActions from './redux/SettingsActions';
import LocalStorage from './storage/LocalStorage';
import { useAccountName } from './utils/AccountNameContext';
import { useInitialData } from './utils/InitialDataContext';
import * as UrlUtils from './utils/UrlUtils';
import addListenerWithNativeCallback from './utils/addListenerWithNativeCallback';
import getViewerUsernameAsync from './utils/getViewerUsernameAsync';
import isUserAuthenticated from './utils/isUserAuthenticated';

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
  const { accountName, setAccountName } = useAccountName();
  const isShowingSplashScreen = useSplashScreenWhileLoadingResources(async () => {
    await initStateAsync();
  });

  const { setCurrentUserData, setHomeScreenData } = useInitialData();

  const { isAuthenticated } = useSelector((data) => {
    const isAuthenticated = isUserAuthenticated(data.session);
    return {
      isAuthenticated,
    };
  });

  React.useEffect(() => {
    addProjectHistoryListener();
  }, []);

  // when the user logs in, set the current account view to the account they just logged in with
  React.useEffect(() => {
    if (!isAuthenticated) {
      setAccountName(undefined);
    } else {
      getViewerUsernameAsync().then(
        (viewerUsername) => {
          if (viewerUsername && !accountName) {
            setAccountName(viewerUsername);
          }
        },
        (error) => {
          setAccountName(undefined);
          console.warn(`There was an error fetching the viewer's username`, error);
        }
      );
    }
  }, [isAuthenticated]);

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

      const [currentUserQueryResult, persistedCurrentAccount] = await Promise.all([
        ApolloClient.query<Home_CurrentUserQuery, Home_CurrentUserQueryVariables>({
          query: Home_CurrentUserDocument,
          context: { headers: { 'expo-session': storedSession?.sessionSecret } },
        }),
        AsyncStorage.getItem('currentAccount'),
        Font.loadAsync(Ionicons.font),
        Platform.OS === 'android'
          ? Font.loadAsync(MaterialIcons.font)
          : new Promise((resolve) => setTimeout(resolve, 0)),
        Font.loadAsync({
          'Inter-Black': require('./assets/Inter/Inter-Black.otf'),
          'Inter-BlackItalic': require('./assets/Inter/Inter-BlackItalic.otf'),
          'Inter-Bold': require('./assets/Inter/Inter-Bold.otf'),
          'Inter-BoldItalic': require('./assets/Inter/Inter-BoldItalic.otf'),
          'Inter-ExtraBold': require('./assets/Inter/Inter-ExtraBold.otf'),
          'Inter-ExtraBoldItalic': require('./assets/Inter/Inter-ExtraBoldItalic.otf'),
          'Inter-ExtraLight': require('./assets/Inter/Inter-ExtraLight.otf'),
          'Inter-ExtraLightItalic': require('./assets/Inter/Inter-ExtraLightItalic.otf'),
          'Inter-Regular': require('./assets/Inter/Inter-Regular.otf'),
          'Inter-Italic': require('./assets/Inter/Inter-Italic.otf'),
          'Inter-Light': require('./assets/Inter/Inter-Light.otf'),
          'Inter-LightItalic': require('./assets/Inter/Inter-LightItalic.otf'),
          'Inter-Medium': require('./assets/Inter/Inter-Medium.otf'),
          'Inter-MediumItalic': require('./assets/Inter/Inter-MediumItalic.otf'),
          'Inter-SemiBold': require('./assets/Inter/Inter-SemiBold.otf'),
          'Inter-SemiBoldItalic': require('./assets/Inter/Inter-SemiBoldItalic.otf'),
          'Inter-Thin': require('./assets/Inter/Inter-Thin.otf'),
          'Inter-ThinItalic': require('./assets/Inter/Inter-ThinItalic.otf'),
        }),
      ]);

      if (currentUserQueryResult.data && currentUserQueryResult.data.viewer) {
        let firstLoadAccountName = persistedCurrentAccount;
        if (firstLoadAccountName) {
          // if there was a persisted account, and it matches the accounts available to the current user, use it
          if (
            [
              currentUserQueryResult.data.viewer.username,
              ...currentUserQueryResult.data.viewer.accounts.map((account) => account.name),
            ].includes(firstLoadAccountName)
          ) {
            setAccountName(firstLoadAccountName);
          } else {
            // if this persisted account is stale, clear it
            await AsyncStorage.removeItem('currentAccount');
          }
        } else {
          // if there was no persisted account, use the current user's personal account
          firstLoadAccountName = currentUserQueryResult.data.viewer.username;
          setAccountName(firstLoadAccountName);
        }

        // set initial data for home screen

        setCurrentUserData(currentUserQueryResult.data);

        if (firstLoadAccountName) {
          const homeScreenData = await ApolloClient.query<
            HomeScreenDataQuery,
            HomeScreenDataQueryVariables
          >({
            query: HomeScreenDataDocument,
            variables: {
              accountName: firstLoadAccountName,
            },
            context: { headers: { 'expo-session': storedSession?.sessionSecret } },
          });

          setHomeScreenData(homeScreenData.data);
        }
      } else {
        // if there is no current user data, clear the accountName
        setAccountName(undefined);
      }
    } finally {
      return;
    }
  };

  if (isShowingSplashScreen) {
    return null;
  }

  let theme = !preferredAppearance ? colorScheme : preferredAppearance;
  if (theme === undefined) {
    theme = 'light';
  }

  const backgroundColor =
    theme === 'dark' ? darkTheme.background.default : lightTheme.background.default;

  return (
    <ThemeProvider themePreference={theme as ThemePreference}>
      <View
        style={[
          styles.container,
          {
            backgroundColor,
          },
        ]}>
        <ActionSheetProvider>
          <Navigation theme={theme === 'light' ? ColorTheme.LIGHT : ColorTheme.DARK} />
        </ActionSheetProvider>
      </View>
    </ThemeProvider>
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
