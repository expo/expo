import { H2 } from '@expo/html-elements';
import * as AuthSession from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session';
import Constants from 'expo-constants';
import { maybeCompleteAuthSession } from 'expo-web-browser';
import React from 'react';
import { Platform, ScrollView, View } from 'react-native';

import { getGUID } from '../../api/guid';
import TitledSwitch from '../../components/TitledSwitch';
import useDimensions from '../../utilities/useDimensions';
import { AuthSection } from './AuthResult';
import LegacyAuthSession from './LegacyAuthSession';

maybeCompleteAuthSession();

const isInClient = Platform.OS !== 'web' && Constants.appOwnership === 'expo';

export default function AuthSessionScreen() {
  const { window } = useDimensions();

  const usePadding = window.width <= 660;

  const [useProxy, setProxy] = React.useState<boolean>(false);
  const [usePKCE, setPKCE] = React.useState<boolean>(true);
  const [prompt, setSwitch] = React.useState<undefined | AuthSession.Prompt>(undefined);

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <ScrollView
        style={{ flex: 1, overflow: 'visible' }}
        contentContainerStyle={{
          maxWidth: 640,
          paddingHorizontal: usePadding ? 12 : 0,
          overflow: 'visible',
        }}>
        <View style={{ marginBottom: 8 }}>
          <H2>Settings</H2>
          <TitledSwitch
            disabled={!isInClient}
            title="Use Proxy"
            value={useProxy}
            setValue={setProxy}
          />
          <TitledSwitch
            title="Switch Accounts"
            value={!!prompt}
            setValue={value => setSwitch(value ? AuthSession.Prompt.SelectAccount : undefined)}
          />
          <TitledSwitch title="Use PKCE" value={usePKCE} setValue={setPKCE} />
        </View>
        <H2>Services</H2>
        <AuthSessionProviders prompt={prompt} usePKCE={usePKCE} useProxy={useProxy} />
        <H2>Legacy</H2>
        <LegacyAuthSession />
      </ScrollView>
    </View>
  );
}

AuthSessionScreen.navigationOptions = {
  title: 'AuthSession',
};

function AuthSessionProviders(props: {
  useProxy: boolean;
  usePKCE: boolean;
  prompt?: AuthSession.Prompt;
}) {
  const { useProxy, usePKCE, prompt } = props;

  const redirectUri = AuthSession.makeRedirectUri({
    native: 'bareexpo://redirect',
    path: 'redirect',
    preferLocalhost: true,
    useProxy,
  });
  const options = {
    useProxy,
    usePKCE,
    prompt,
    redirectUri,
  };

  const providers = [
    Facebook,
    Spotify,
    Google,
    Reddit,
    Github,
    Coinbase,
    Uber,
    Slack,
    FitBit,
    Okta,
    Identity,
    // Azure,
  ];
  return (
    <View style={{ flex: 1 }}>
      {providers.map((Provider, index) => (
        <Provider key={`-${index}`} {...options} />
      ))}
    </View>
  );
}

function Google({ useProxy, prompt, usePKCE }: any) {
  const redirectUri = AuthSession.makeRedirectUri({
    path: 'redirect',
    preferLocalhost: true,
    useProxy,
    native: `com.googleusercontent.apps.${getGUID()}:/oauthredirect`,
  });
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: useProxy
        ? '29635966244-bc5tjrdacdaktqorhinsbtda80tchl7n.apps.googleusercontent.com'
        : getGUID(),
      redirectUri,
      prompt,
      scopes: ['profile', 'email', 'openid'],
      usePKCE,
    },
    discovery
  );

  return (
    <AuthSection
      disabled={!useProxy && isInClient}
      request={request}
      title="google"
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// Couldn't get this working. API is really confusing.
function Azure({ useProxy, prompt, usePKCE }: any) {
  const redirectUri = AuthSession.makeRedirectUri({
    path: 'redirect',
    preferLocalhost: true,
    useProxy,
    native: Platform.select<string>({
      ios: 'msauth.dev.expo.Payments://auth',
      android: 'msauth://dev.expo.payments/sZs4aocytGUGvP1%2BgFAavaPMPN0%3D',
    }),
  });

  // 'https://login.microsoftonline.com/your-tenant-id/v2.0',
  const discovery = AuthSession.useAutoDiscovery(
    'https://login.microsoftonline.com/f8cdef31-a31e-4b4a-93e4-5f571e91255a/v2.0'
  );
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: '96891596-721b-4ae1-8e67-674809373165',
      redirectUri,
      prompt,
      extraParams: {
        domain_hint: 'live.com',
      },
      // redirectUri: 'msauth.{bundleId}://auth',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      usePKCE,
    },
    // discovery
    discovery
  );

  return (
    <AuthSection
      title="azure"
      disabled={isInClient}
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function Okta({ redirectUri, usePKCE, useProxy }: any) {
  const discovery = AuthSession.useAutoDiscovery('https://dev-720924.okta.com/oauth2/default');
  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: '0oa4su9fhp4F2F4Eg4x6',
      redirectUri,
      scopes: ['openid', 'profile'],
      usePKCE,
    },
    discovery
  );

  return (
    <AuthSection
      title="okta"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// Reddit only allows one redirect uri per client Id
// We'll only support bare, and proxy in this example
// If the redirect is invalid with http instead of https on web, then the provider
// will let you authenticate but it will redirect with no data and the page will appear broken.
function Reddit({ redirectUri, prompt, usePKCE, useProxy }: any) {
  let clientId: string;

  if (isInClient) {
    if (useProxy) {
      // Using the proxy in the client.
      // This expects the URI to be 'https://auth.expo.io/@community/native-component-list'
      // so you'll need to be signed into community or be using the public demo
      clientId = 'IlgcZIpcXF1eKw';
    } else {
      // // Normalize the host to `localhost` for other testers
      clientId = 'CPc_adCUQGt9TA';
    }
  } else {
    if (Platform.OS === 'web') {
      // web apps with uri scheme `https://localhost:19006`
      clientId = '9k_oYNO97ly-5w';
    } else {
      // Native bare apps with uri scheme `bareexpo`
      clientId = '2OFsAA7h63LQJQ';
    }
  }

  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId,
      clientSecret: '',
      redirectUri,
      prompt,
      scopes: ['identity'],
      usePKCE,
    },
    {
      authorizationEndpoint: 'https://www.reddit.com/api/v1/authorize.compact',
      tokenEndpoint: 'https://www.reddit.com/api/v1/access_token',
    }
  );

  return (
    <AuthSection
      title="reddit"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// TODO: Add button to test using an invalid redirect URI. This is a good example of AuthError.
// Works for all platforms
function Github({ redirectUri, prompt, usePKCE, useProxy }: any) {
  let clientId: string;

  if (isInClient) {
    if (useProxy) {
      // Using the proxy in the client.
      clientId = '2e4298cafc7bc93ceab8';
    } else {
      clientId = '7eb5d82d8f160a434564';
    }
  } else {
    if (Platform.OS === 'web') {
      // web apps
      clientId = 'fd9b07204f9d325e8f0e';
    } else {
      // Native bare apps with uri scheme `bareexpo`
      clientId = '498f1fae3ae16f066f34';
    }
  }

  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['identity'],
      usePKCE,
      prompt,
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
      title="github"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// I couldn't get access to any scopes
// This never returns to the app after authenticating
function Uber({ redirectUri, prompt, usePKCE, useProxy }: any) {
  // https://developer.uber.com/docs/riders/guides/authentication/introduction
  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: 'kTpT4xf8afVxifoWjx5Nhn-IFamZKp2x',
      redirectUri,
      scopes: [],
      usePKCE,
      prompt,
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
      title="uber"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// https://dev.fitbit.com/apps/new
// Easy to setup
// Only allows one redirect URI per app (clientId)
// Refresh doesn't seem to return a new access token :[
function FitBit({ redirectUri, prompt, usePKCE, useProxy }: any) {
  let clientId: string;

  if (isInClient) {
    if (useProxy) {
      // Using the proxy in the client.
      clientId = '22BNXR';
    } else {
      // Client without proxy
      clientId = '22BNXX';
    }
  } else {
    if (Platform.OS === 'web') {
      // web apps with uri scheme `https://localhost:19006`
      clientId = '22BNXQ';
    } else {
      // Native bare apps with uri scheme `bareexpo`
      clientId = '22BGYS';
    }
  }

  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['activity', 'sleep'],
      prompt,
      usePKCE,
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
      title="fitbit"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function Facebook({ usePKCE, prompt, useProxy }: any) {
  const redirectUri = AuthSession.makeRedirectUri({
    path: 'redirect',
    preferLocalhost: true,
    useProxy,
    native: `fb145668956753819://authorize`,
  });

  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: '145668956753819',
      redirectUri,
      scopes: ['public_profile', 'user_likes'],
      usePKCE,
      prompt,
      extraParams: {
        display: 'popup',
        // Rerequest decliened permissions, to test this,
        // add "email" to the scopes and try again (be sure not to allow email permission).
        auth_type: 'rerequest',
      },
    },
    {
      authorizationEndpoint: 'https://www.facebook.com/v6.0/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/v6.0/oauth/access_token',
    }
  );

  console.log(request?.url);
  return (
    <AuthSection
      title="facebook"
      disabled={isInClient && !useProxy}
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

function Slack({ redirectUri, prompt, usePKCE, useProxy }: any) {
  // https://api.slack.com/apps
  // After you created an app, navigate to [Features > OAuth & Permissions]
  // - Add a redirect URI Under [Redirect URLs]
  // - Under [Scopes] add the scopes you want to request from the user
  // Next go to [App Credentials] to get your client ID and client secret
  // No refresh token or expiration is returned, assume the token lasts forever.
  const [request, result, promptAsync] = useAuthRequest(
    // config
    {
      clientId: '58692702102.1023025401076',
      redirectUri,
      scopes: ['emoji:read'],
      prompt,
      usePKCE,
    },
    // discovery
    {
      authorizationEndpoint: 'https://slack.com/oauth/authorize',
      tokenEndpoint: 'https://slack.com/api/oauth.access',
    }
  );

  return (
    <AuthSection
      title="slack"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// Works on all platforms
function Spotify({ redirectUri, prompt, usePKCE, useProxy }: any) {
  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: 'a946eadd241244fd88d0a4f3d7dea22f',
      redirectUri,
      scopes: ['user-read-email', 'playlist-modify-public', 'user-read-private'],
      usePKCE,
      extraParams: {
        show_dialog: false,
      },
      prompt,
    },
    // discovery
    {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token',
    }
  );

  return (
    <AuthSection
      title="spotify"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// Works on all platforms
function Identity({ redirectUri, prompt, useProxy }: any) {
  const discovery = AuthSession.useAutoDiscovery('https://demo.identityserver.io');

  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: 'native.code',
      redirectUri,
      prompt,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    },
    discovery
  );

  return (
    <AuthSection
      title="identity4"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}

// Doesn't work with proxy
function Coinbase({ redirectUri, prompt, useProxy }: any) {
  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: '13b2bc8d9114b1cb6d0132cf60c162bc9c2d5ec29c2599003556edf81cc5db4e',
      redirectUri,
      prompt,
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
      disabled={useProxy}
      title="coinbase"
      request={request}
      result={result}
      promptAsync={promptAsync}
      useProxy={useProxy}
    />
  );
}
