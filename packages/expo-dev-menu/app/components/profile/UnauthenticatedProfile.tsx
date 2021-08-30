import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import url from 'url';

import DevMenuContext from '../../DevMenuContext';
import * as DevMenuWebBrowser from '../../DevMenuWebBrowser';
import * as DevMenuInternal from '../../DevMenuInternal';

import Colors from '../../constants/Colors';
import Endpoints from '../../constants/Endpoints';
import Button from '../Button';
import Loading from '../Loading';
import { StyledText } from '../Text';

export default function UnauthenticatedProfile() {
  const context = React.useContext(DevMenuContext);
  const [authenticationError, setAuthenticationError] = React.useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const mounted = React.useRef<boolean | null>(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const _handleAuthentication = async (urlPath: string) => {
    if (isAuthenticating || !mounted.current) {
      return;
    }
    setAuthenticationError(null);
    setIsAuthenticating(true);

    try {
      const scheme = await DevMenuInternal.getAuthSchemeAsync();
      const redirectBase = `${scheme}://auth`;
      const authSessionURL = `${
        Endpoints.website.origin
      }/${urlPath}?app_redirect_uri=${encodeURIComponent(redirectBase)}`;

      const result = await DevMenuWebBrowser.openAuthSessionAsync(authSessionURL, redirectBase);

      if (result.type === 'success') {
        const resultURL = url.parse(result.url, true);
        const sessionSecret = decodeURIComponent(resultURL.query['session_secret'] as string);

        if (mounted.current) {
          await context.setSession({ sessionSecret });
        }
      }
    } catch (e) {
      if (mounted.current) {
        setAuthenticationError(e.message);
      }
    } finally {
      if (mounted.current) {
        setIsAuthenticating(false);
      }
    }
  };

  const _handleSignInPress = async () => {
    await _handleAuthentication('login');
  };

  const _handleSignUpPress = async () => {
    await _handleAuthentication('signup');
  };

  const title = 'Sign in to Continue';
  const description = 'Sign in or create an Expo account to view your projects.';

  if (isAuthenticating) {
    return <Loading />;
  }

  return (
    <View style={styles.contentContainer}>
      <StyledText style={styles.titleText}>{title}</StyledText>

      <StyledText
        style={styles.descriptionText}
        darkColor={Colors.dark.secondaryText}
        lightColor={Colors.light.secondaryText}>
        {description}
      </StyledText>

      <Button onPress={_handleSignInPress} tittle="Sign in to your account" />
      <View style={{ marginBottom: 15 }} />
      <Button onPress={_handleSignUpPress} tittle="Sign up for Expo" />

      {authenticationError && (
        <StyledText
          style={styles.errorText}
          darkColor={Colors.dark.error}
          lightColor={Colors.light.error}>
          Something went wrong when authenticating: {authenticationError}
        </StyledText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    marginBottom: 15,
    fontWeight: '400',
    fontSize: 18,
  },
  descriptionText: {
    textAlign: 'center',
    marginHorizontal: 15,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        fontSize: 12,
        lineHeight: 18,
      },
      android: {
        fontSize: 14,
        lineHeight: 20,
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
