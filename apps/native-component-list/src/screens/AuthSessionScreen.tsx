import { Linking } from 'expo';
import * as AuthSession from 'expo-auth-session';
import { getRedirectUrl, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import Constants from 'expo-constants';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getGUID } from '../api/guid';
import Button from '../components/Button';
import TitledSwitch from '../components/TitledSwitch';

const AuthJson = require('../../auth.json');

function getAuthSessionRedirectUrl(url?: string): string {
  try {
    return getRedirectUrl(url);
  } catch (_) {}
  return '';
}

function makeUrl(url: string): string {
  try {
    return Linking.makeUrl(url);
  } catch (_) {}
  return '';
}

const isInClient = Platform.OS !== 'web' && Constants.appOwnership === 'expo';

const nativeRedirectUri = Platform.select({
  // TODO: Bacon: Fix Linking.makeUrl for web
  web: getAuthSessionRedirectUrl('redirect'),
  default: isInClient ? getAuthSessionRedirectUrl() : `io.identityserver.demo://oauthredirect`,
});

export default function AuthSessionScreen() {
  const [useProxy, setProxy] = React.useState<boolean>(false);

  const redirectUri = React.useMemo(() => {
    if (isInClient) {
      return useProxy ? nativeRedirectUri : makeUrl('redirect');
    }
    return Platform.select({
      // TODO: Bacon: Fix Linking.makeUrl for web
      web: getAuthSessionRedirectUrl('redirect'),
      default: nativeRedirectUri,
    });
  }, [useProxy]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 36 }}>
      {isInClient && <TitledSwitch title="Use Proxy" value={useProxy} setValue={setProxy} />}
      <Uber redirectUri={redirectUri} useProxy={useProxy} />
      <Slack redirectUri={redirectUri} useProxy={useProxy} />
      <Spotify redirectUri={redirectUri} useProxy={useProxy} />
      <Identity redirectUri={redirectUri} useProxy={useProxy} />
      <Coinbase redirectUri={redirectUri} useProxy={useProxy} />
      <Okta redirectUri={redirectUri} useProxy={useProxy} />
      <Github redirectUri={redirectUri} useProxy={useProxy} />
      <FitBit redirectUri={redirectUri} useProxy={useProxy} />
      <Reddit redirectUri={redirectUri} useProxy={useProxy} />
      <Google useProxy={useProxy} />
      <Azure useProxy={useProxy} />
      <LegacyAuthSession />
    </ScrollView>
  );
}

function Result({ title, result }: any) {
  if (result)
    return (
      <Text style={styles.text}>
        {title}: {JSON.stringify(result, null, 2)}
      </Text>
    );
  return null;
}

AuthSessionScreen.navigationOptions = {
  title: 'AuthSession',
};

function Google({ useProxy }: any) {
  const redirectUri = React.useMemo(
    () =>
      Platform.select({
        web: getAuthSessionRedirectUrl('redirect'),
        default: useProxy
          ? getAuthSessionRedirectUrl()
          : `com.googleusercontent.apps.${getGUID()}:/oauthredirect`,
      }),
    [useProxy]
  );
  const discovery = useAutoDiscovery('https://accounts.google.com');

  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: getGUID(),
      redirectUri,
      scopes: ['profile', 'email', 'openid'],
    },
    discovery
  );

  return (
    <AuthSection
      disabled={!useProxy && isInClient}
      request={request}
      title="Google"
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// Couldn't get this working. API is really confusing.
function Azure({ useProxy }: any) {
  const redirectUri = React.useMemo(
    () =>
      Platform.select({
        web: getAuthSessionRedirectUrl('redirect'),
        default: useProxy
          ? getAuthSessionRedirectUrl()
          : Platform.select<string>({
              ios: 'msauth.dev.expo.Payments://auth',
              android: 'msauth://dev.expo.payments/sZs4aocytGUGvP1%2BgFAavaPMPN0%3D',
            }),
      }),
    [useProxy]
  ) as string;

  // 'https://login.microsoftonline.com/your-tenant-id/v2.0',
  const discovery = useAutoDiscovery(
    'https://login.microsoftonline.com/f8cdef31-a31e-4b4a-93e4-5f571e91255a/v2.0'
  );
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: '96891596-721b-4ae1-8e67-674809373165',
      redirectUri,
      extraParams: {
        domain_hint: 'live.com',
      },
      // redirectUri: 'msauth.{bundleId}://auth',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    },
    // discovery
    discovery
  );

  return (
    <AuthSection
      title="Azure"
      disabled={!useProxy && isInClient}
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function Okta({ redirectUri, useProxy }: any) {
  const discovery = useAutoDiscovery('https://dev-720924.okta.com/oauth2/default');
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: '0oa4su9fhp4F2F4Eg4x6',
      redirectUri,
      scopes: ['openid', 'profile'],
    },
    // discovery
    discovery
  );

  return (
    <AuthSection
      title="Okta"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function Coinbase({ redirectUri, useProxy }: any) {
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: AuthJson.COINBASE_CLIENT_ID,
      clientSecret: AuthJson.COINBASE_CLIENT_SECRET,
      redirectUri,
      // This shouldn't be done.
      usePKCE: false,
      // weird format
      scopes: ['wallet:accounts:read'],
    },
    // discovery
    {
      authorizationEndpoint: 'https://www.coinbase.com/oauth/authorize',
      tokenEndpoint: 'https://api.coinbase.com/oauth/token',
      revocationEndpoint: 'https://api.coinbase.com/oauth/revoke',
    }
  );

  return (
    <AuthSection
      title="Coinbase"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function Reddit({ redirectUri, useProxy }: any) {
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: 'CPc_adCUQGt9TA',
      clientSecret: '',
      redirectUri,
      scopes: ['identity'],
    },
    // discovery
    {
      authorizationEndpoint: 'https://www.reddit.com/api/v1/authorize.compact',
      tokenEndpoint: 'https://www.reddit.com/api/v1/access_token',
    }
  );

  return (
    <AuthSection
      title="Reddit"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// TODO: Add button to test using an invalid redirect URI. This is a good example of AuthError.
function Github({ redirectUri, useProxy }: any) {
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: AuthJson.GITHUB_CLIENT_ID,
      clientSecret: AuthJson.GITHUB_CLIENT_SECRET,
      // Github requires two slashes
      redirectUri,
      scopes: ['identity'],
    },
    // discovery
    {
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
      revocationEndpoint:
        'https://github.com/settings/connections/applications/d529db5d7d81c2d50adf',
    }
  );

  return (
    <AuthSection
      title="Github"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function Uber({ redirectUri, useProxy }: any) {
  // https://developer.uber.com/docs/riders/guides/authentication/introduction
  // I couldn't get access to any scopes
  // This never returns to the app after authenticating
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: AuthJson.UBER_CLIENT_ID,
      clientSecret: AuthJson.UBER_CLIENT_SECRET,
      redirectUri,
      scopes: [],
      // Enable to test invalid_scope error
      // scopes: ['invalid'],
    },
    // discovery
    {
      authorizationEndpoint: 'https://login.uber.com/oauth/v2/authorize',
      tokenEndpoint: 'https://login.uber.com/oauth/v2/token',
      revocationEndpoint: 'https://login.uber.com/oauth/v2/revoke',
    }
  );

  return (
    <AuthSection
      title="Uber"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}
function FitBit({ redirectUri, useProxy }: any) {
  // https://dev.fitbit.com/apps/new
  // Easy to setup
  // Refresh doesn't seem to return a new access token :[
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: AuthJson.FITBIT_CLIENT_ID,
      clientSecret: AuthJson.FITBIT_CLIENT_SECRET,
      redirectUri,
      scopes: ['activity', 'sleep'],
    },
    // discovery
    {
      authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
      tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
      revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke',
    }
  );

  return (
    <AuthSection
      title="FitBit"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function Slack({ redirectUri, useProxy }: any) {
  // https://api.slack.com/apps
  // After you created an app, navigate to [Features > OAuth & Permissions]
  // - Add a redirect URI Under [Redirect URLs]
  // - Under [Scopes] add the scopes you want to request from the user
  // Next go to [App Credentials] to get your client ID and client secret
  // No refresh token or expiration is returned, assume the token lasts forever.
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: AuthJson.SLACK_CLIENT_ID,
      clientSecret: AuthJson.SLACK_CLIENT_SECRET,
      redirectUri,
      scopes: ['emoji:read'],
    },
    // discovery
    {
      authorizationEndpoint: 'https://slack.com/oauth/authorize',
      tokenEndpoint: 'https://slack.com/api/oauth.access',
    }
  );

  return (
    <AuthSection
      title="Slack"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function Spotify({ redirectUri, useProxy }: any) {
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: AuthJson.SPOTIFY_CLIENT_ID,
      clientSecret: AuthJson.SPOTIFY_CLIENT_SECRET,
      redirectUri,
      scopes: ['user-read-email', 'playlist-modify-public', 'user-read-private'],
    },
    // discovery
    {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token',
    }
  );

  return (
    <AuthSection
      title="Spotify"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}
function Identity({ redirectUri, useProxy }: any) {
  const discovery = useAutoDiscovery('https://demo.identityserver.io');

  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: 'native.code',
      clientSecret: 'a45500e2a01d48b4939727846ff5ab24',
      redirectUri,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    },
    discovery
  );

  return (
    <AuthSection
      title="Identity"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function AuthSection({ title, request, result, promptAsync, useProxy, disabled }: any) {
  return (
    <View>
      <Button
        disabled={disabled}
        title={title}
        buttonStyle={styles.button}
        onPress={() => promptAsync({ useProxy })}
      />
      <Text>Redirect "{request?.redirectUri}"</Text>
      <Result title={title} result={result} />
    </View>
  );
}

const auth0ClientId = '8wmGum25h3KU2grnmZtFvMQeitmIdSDS';
const auth0Domain = 'https://expo-testing.auth0.com';

/**
 * Converts an object to a query string.
 */
function toQueryString(params: object) {
  return (
    '?' +
    Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  );
}

/**
 * Test the `AuthSession.startAsync` functionality.
 */
function LegacyAuthSession() {
  const [result, setResult] = React.useState<any | null>(null);
  const isInvalid = Constants.manifest.id !== '@community/native-component-list';

  if (isInvalid) {
    return (
      <View style={styles.container}>
        <Text style={styles.oopsTitle}>Hello, developer person!</Text>
        <Text style={styles.oopsText}>
          The experience id {Constants.manifest.id} will not work with this due to the authorized
          callback URL configuration on Auth0{' '}
        </Text>
        <Text style={styles.oopsText}>
          Sign in as @community to use this example, or change the Auth0 client id and domain in
          AuthSessionScreen.js
        </Text>
      </View>
    );
  }

  const handlePressAsync = async () => {
    const redirectUrl = AuthSession.getRedirectUrl();
    const authUrl =
      `${auth0Domain}/authorize?` +
      toQueryString({
        client_id: auth0ClientId,
        response_type: 'token',
        scope: 'openid name',
        redirect_uri: redirectUrl,
      });

    const result = await AuthSession.startAsync({ authUrl });
    setResult(result);
  };

  return (
    <View>
      <Button title="Authenticate using an external service" onPress={handlePressAsync} />
      <Result title={'Legacy'} result={result} />
      <Text style={styles.faintText}>Return Url: {AuthSession.getDefaultReturnUrl()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  button: {
    marginVertical: 16,
  },
  text: {
    marginVertical: 15,
    maxWidth: '80%',
    marginHorizontal: 10,
  },
  faintText: {
    color: '#888',
    marginHorizontal: 30,
  },
  oopsTitle: {
    fontSize: 25,
    marginBottom: 5,
    textAlign: 'center',
  },
  oopsText: {
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 30,
  },
});
