import { borderRadius, spacing } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Spacer, useExpoTheme } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import url from 'url';

import ApolloClient from '../../api/ApolloClient';
import Config from '../../api/Config';
import {
  Home_ViewerPrimaryAccountNameDocument,
  Home_ViewerPrimaryAccountNameQuery,
  Home_ViewerPrimaryAccountNameQueryVariables,
} from '../../graphql/types';
import { useDispatch, useSelector } from '../../redux/Hooks';
import SessionActions from '../../redux/SessionActions';
import { useAccountName } from '../../utils/AccountNameContext';
import hasSessionSecret from '../../utils/hasSessionSecret';

type Props = {
  refetch: () => Promise<void>;
};

export function LoggedOutAccountView({ refetch }: Props) {
  const dispatch = useDispatch();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [isFinishedAuthenticating, setIsFinishedAuthenticating] = React.useState(false);
  const [authenticationError, setAuthenticationError] = React.useState<string | null>(null);
  const mounted = React.useRef<boolean | null>(true);
  const theme = useExpoTheme();
  const { setAccountName } = useAccountName();
  const navigation = useNavigation();

  const { sessionSecretExists } = useSelector((data) => {
    const sessionSecretExists = hasSessionSecret(data.session);
    return {
      sessionSecretExists,
    };
  });

  React.useEffect(() => {
    async function refetchThenGoBackAsync() {
      // after logging in, wait for redux action to dispatch, refetch with new sessionSecret, then dismiss modal
      if (isFinishedAuthenticating && sessionSecretExists) {
        try {
          await refetch();
        } finally {
          // in the case that it rejects, we still want to dismiss the modal

          // if it's an internet issue, the user will be able to try to refresh the homepage

          // if it's an issue with the sessionSecret being invalid, the user will be able to try to
          // log in again and rewrite the sessionSecret

          navigation.goBack();
        }
      }
    }

    refetchThenGoBackAsync();
  }, [isFinishedAuthenticating, sessionSecretExists]);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const _handleSignInPress = async () => {
    await _handleAuthentication('login');
  };

  const _handleSignUpPress = async () => {
    await _handleAuthentication('signup');
  };

  const _handleAuthentication = async (urlPath: string) => {
    if (isAuthenticating) {
      return;
    }
    setAuthenticationError(null);
    setIsAuthenticating(true);

    try {
      const redirectBase = 'expauth://auth';
      const authSessionURL = `${
        Config.website.origin
      }/${urlPath}?confirm_account=1&app_redirect_uri=${encodeURIComponent(redirectBase)}`;
      console.log(Config.website.origin, authSessionURL);
      const result = await WebBrowser.openAuthSessionAsync(authSessionURL, redirectBase, {
        /** note(brentvatne): We should disable the showInRecents option when
         * https://github.com/expo/expo/issues/8072 is resolved. This workaround
         * prevents the Chrome Custom Tabs activity from closing when the user
         * switches from the login / sign up form to a password manager or 2fa
         * app. The downside of using this flag is that the browser window will
         * remain open in the background after authentication completes. */
        showInRecents: true,
      });

      if (!mounted.current) {
        return;
      }

      if (result.type === 'success') {
        const resultURL = url.parse(result.url, true);
        const encodedSessionSecret = resultURL.query['session_secret'] as string;
        if (!encodedSessionSecret) {
          throw new Error('session_secret is missing in auth redirect query');
        }

        const sessionSecret = decodeURIComponent(encodedSessionSecret);

        const viewerPrimaryAccountNameResult = await ApolloClient.query<
          Home_ViewerPrimaryAccountNameQuery,
          Home_ViewerPrimaryAccountNameQueryVariables
        >({
          query: Home_ViewerPrimaryAccountNameDocument,
          fetchPolicy: 'network-only',
          context: {
            headers: { 'expo-session': sessionSecret },
          },
        });

        if (
          viewerPrimaryAccountNameResult.errors &&
          viewerPrimaryAccountNameResult.errors.length > 0
        ) {
          throw viewerPrimaryAccountNameResult.errors[0];
        }

        const primaryAccountName =
          viewerPrimaryAccountNameResult.data.meUserActor?.primaryAccount.name;
        if (!primaryAccountName) {
          throw new Error('Logged in user must have a primary account');
        }

        dispatch(
          SessionActions.setSession({
            sessionSecret,
          })
        );

        setAccountName(primaryAccountName);
        setIsFinishedAuthenticating(true);
      }
    } catch (e) {
      // TODO(wschurman): Put this into Sentry
      console.error({ e });
      setAuthenticationError(e.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View padding="medium">
      <Text color="secondary" type="InterRegular" style={{ lineHeight: 20 }}>
        Log in or create an account to access your projects, view local development servers, and
        more.
      </Text>
      <Spacer.Vertical size="medium" />

      <TouchableOpacity
        onPress={_handleSignInPress}
        style={{
          backgroundColor: theme.button.tertiary.background,
          padding: spacing[3],
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: borderRadius.medium,
        }}>
        <Text style={{ color: theme.button.tertiary.foreground }} type="InterSemiBold">
          Log In
        </Text>
      </TouchableOpacity>

      <Spacer.Vertical size="small" />

      <TouchableOpacity
        onPress={_handleSignUpPress}
        style={{
          backgroundColor: theme.button.secondary.background,
          padding: spacing[3],
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: borderRadius.medium,
        }}>
        <Text style={{ color: theme.button.secondary.foreground }} type="InterSemiBold">
          Sign Up
        </Text>
      </TouchableOpacity>

      {authenticationError && (
        <>
          <Spacer.Vertical size="small" />
          <Text type="InterRegular" color="error" size="small">
            Something went wrong when authenticating: {authenticationError}
          </Text>
        </>
      )}
    </View>
  );
}
