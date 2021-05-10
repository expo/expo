import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import url from 'url';

import Analytics from '../api/Analytics';
import ApolloClient from '../api/ApolloClient';
import Config from '../api/Config';
import Colors from '../constants/Colors';
import { useDispatch } from '../redux/Hooks';
import SessionActions from '../redux/SessionActions';
import ScrollView from './NavigationScrollView';
import PrimaryButton from './PrimaryButton';
import { StyledText } from './Text';

export default function ProfileUnauthenticated() {
  const dispatch = useDispatch();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [authenticationError, setAuthenticationError] = React.useState<string | null>(null);
  const mounted = React.useRef<boolean | null>(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const _handleSignInPress = async () => {
    await _handleAuthentication('login', Analytics.events.USER_LOGGED_IN);
  };

  const _handleSignUpPress = async () => {
    await _handleAuthentication('signup', Analytics.events.USER_CREATED_ACCOUNT);
  };

  const _handleAuthentication = async (urlPath: string, analyticsEvent: string) => {
    if (isAuthenticating) {
      return;
    }
    setAuthenticationError(null);
    setIsAuthenticating(true);

    try {
      const redirectBase = 'expauth://auth';
      const authSessionURL = `${
        Config.website.origin
      }/${urlPath}?app_redirect_uri=${encodeURIComponent(redirectBase)}`;
      const result = await WebBrowser.openAuthSessionAsync(authSessionURL, redirectBase);

      if (!mounted.current) {
        return;
      }

      if (result.type === 'success') {
        const resultURL = url.parse(result.url, true);
        const sessionSecret = resultURL.query['session_secret'] as string;
        const usernameOrEmail = resultURL.query['username_or_email'] as string;

        if (!sessionSecret) {
          throw new Error('session_secret is missing in auth redirect query');
        }

        const trackingOpts = {
          usernameOrEmail,
        };
        Analytics.identify(null, trackingOpts);
        Analytics.track(analyticsEvent, trackingOpts);

        ApolloClient.resetStore();
        dispatch(
          SessionActions.setSession({
            sessionSecret: decodeURIComponent(sessionSecret),
          })
        );
      }
    } catch (e) {
      // TODO(wschurman): Put this into Sentry
      console.log({ e });
      setAuthenticationError(e.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const title = Platform.OS === 'ios' ? 'Sign in to Continue' : 'Your Profile';
  const description =
    Platform.OS === 'ios'
      ? 'Sign in or create an Expo account to view your projects.'
      : 'To access your own projects, please sign in or create an Expo account.';
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StyledText style={styles.titleText}>{title}</StyledText>

      <StyledText
        style={styles.descriptionText}
        darkColor="#ccc"
        lightColor="rgba(36, 44, 58, 0.7)">
        {description}
      </StyledText>

      <PrimaryButton onPress={_handleSignInPress} fallback={TouchableOpacity}>
        Sign in to your account
      </PrimaryButton>

      <View style={{ marginBottom: 20 }} />

      <PrimaryButton plain onPress={_handleSignUpPress} fallback={TouchableOpacity}>
        Sign up for Expo
      </PrimaryButton>

      {authenticationError && (
        <StyledText
          style={styles.errorText}
          darkColor={Colors.dark.error}
          lightColor={Colors.light.error}>
          Something went wrong when authenticating: {authenticationError}
        </StyledText>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  titleText: {
    marginBottom: 15,
    fontWeight: '400',
    ...Platform.select({
      ios: {
        fontSize: 22,
      },
      android: {
        fontSize: 23,
      },
    }),
  },
  descriptionText: {
    textAlign: 'center',
    marginHorizontal: 15,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        fontSize: 15,
        lineHeight: 20,
      },
      android: {
        fontSize: 16,
        lineHeight: 24,
      },
    }),
  },
  errorText: {
    textAlign: 'center',
    marginHorizontal: 15,
    marginTop: 20,
    ...Platform.select({
      ios: {
        fontSize: 15,
        lineHeight: 20,
      },
      android: {
        fontSize: 16,
        lineHeight: 24,
      },
    }),
  },
});
