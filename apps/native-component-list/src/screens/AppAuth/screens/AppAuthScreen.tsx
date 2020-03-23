import './side-effects';

import { AuthorizationNotifier, AuthorizationRequest, TokenResponse } from '@openid/appauth';
import * as AppAuth from 'expo-app-auth';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
  Button,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ServicePicker from '../components/ServicePicker';
import Services from '../constants/Services';
import AuthContext from '../context/AuthContext';
import AuthProvider from '../context/AuthProvider';
import ServiceContext from '../context/ServiceContext';
import ServiceProvider from '../context/ServiceProvider';

function tokenExpirationTimeLeft({
  expiresIn = 0,
  issuedAt = 0,
}: Pick<TokenResponse, 'expiresIn' | 'issuedAt'>): number {
  // Time is returned in seconds
  return (Date.now() - (expiresIn + issuedAt * 1000)) / 1000;
}

function expiresInString({
  expiresIn = 0,
  issuedAt = 0,
}: Pick<TokenResponse, 'expiresIn' | 'issuedAt'>): string {
  // Time is returned in seconds, convert to milliseconds
  const date = expiresIn + issuedAt * 1000;
  return new Date(date).toLocaleTimeString();
}

function useAuthCode(
  issuerOrServiceConfig: string | AppAuth.ExpoAuthorizationServiceConfigurationJson
) {
  if (Platform.OS !== 'web') return {};
  const [tokenResponse, setToken] = React.useState<any>(null);
  const [error, setError] = React.useState<any>(null);

  React.useEffect(() => {
    const authorizationHandler = new AppAuth.ExpoRequestHandler();
    const notifier = new AuthorizationNotifier();
    authorizationHandler.setAuthorizationNotifier(notifier);
    notifier.setAuthorizationListener(async (request, response, error) => {
      console.log('Authorization request complete ', request, response, error);
      if (response) {
        console.log(`Authorization Code  ${response.code}`);
        const extras = { ...(request.extras || {}), ...(request.internal || {}) };

        const tokenResponse = await AppAuth.exchangeAsync(
          {
            clientId: request.clientId,
            redirectUri: request.redirectUri,
            code: response.code,
            extras: {
              // Google Auth on web requires a secret for the exchange but not for the code request.
              client_secret: extras.client_secret,
              code_verifier: extras.code_verifier,
            },
          },
          issuerOrServiceConfig
        );

        setToken(tokenResponse);
      }
    });

    (async () => {
      let code: string | null = null;
      const url = await Linking.getInitialURL();
      const params = AppAuth.ExpoRequestHandler.getQueryParams(url || window.location.href);
      code = params['code'];
      if (!code) {
        setError('Unable to get authorization code');
      }
      authorizationHandler.completeAuthorizationRequestIfPossible();
    })();
  }, [issuerOrServiceConfig]);

  return {
    response: tokenResponse,
    error,
  };
}

function clearQueryParams() {
  if (Platform.OS !== 'web') return;
  //get full URL
  const currURL = window.location.href; //get current address

  //Get the URL between what's after '/' and befor '?'
  //1- get URL after'/'
  const afterDomain = currURL.substring(currURL.lastIndexOf('/') + 1);
  //2- get the part before '?'
  const myNewURL = afterDomain.split('?')[0];

  //here you pass the new URL extension you want to appear after the domains '/'. Note that the previous identifiers or "query string" will be replaced.
  window.history.pushState({}, document.title, '/' + myNewURL);
}

const kRedirectURI = 'com.example.app:/oauth2redirect/example-provider';

/// Number of seconds the access token is refreshed before it actually expires.
const kExpiryTimeTolerance = 60;

function useLinking(): string | null {
  const [link, setLink] = React.useState<string | null>(null);
  React.useEffect(() => {
    Linking.getInitialURL().then(url => setLink(url));
    const listener = ({ url }: { url: string | null }) => setLink(url);
    Linking.addEventListener('url', listener);
    return () => Linking.removeEventListener('url', listener);
  }, []);
  return link;
}

function useParentNotifier(url: string) {
  const link = useLinking();

  React.useEffect(() => {
    console.log('url >>>', url);
    if (link === url) {
      // get the URL parameters which will include the auth token
      const params = window.location.search;
      if (window.opener) {
        // send them to the opening window
        window.opener.postMessage(params);
        // close the popup
        window.close();
      }
    }
  }, [link]);
}

function App() {
  useParentNotifier('batman');

  const { auth, setAuth } = React.useContext(AuthContext);
  const [authResponse, setAuthResponse] = React.useState<any>(null);
  const [message, setMessage] = React.useState<string>('');
  const { service } = React.useContext(ServiceContext);
  const currentService = Services[service];
  const { response, error } = useAuthCode(currentService?.issuer);

  // const expired = checkIfTokenExpired(auth);

  async function setNextAuthAsync(authState: any) {
    (async () => {
      try {
        setAuth(authState);
        if (authState) {
          clearQueryParams();
        }
      } catch ({ message }) {
        alert(message);
      }
    })();
  }

  React.useEffect(() => {
    if (message) console.log('MSG: ', message);
  }, [message]);
  React.useEffect(() => {
    console.log('got response: ', response, error);
    if (response) {
      setNextAuthAsync(response);
    }
  }, [response, error]);

  async function signOutAsync(authState: any) {
    try {
      await AppAuth.revokeAsync(
        { ...currentService.config, token: authState.accessToken, tokenTypeHint: 'access_token' },
        currentService.issuer
      );
      setAuth(null);
    } catch (error) {
      console.log('Error revoking: ', error);
      setMessage('Failed to revoke token: ' + error.message);
    }
  }

  async function signInAsync(): Promise<TokenResponse> {
    try {
      await WebBrowser.dismissAuthSession();
    } catch (error) {
      console.log('weird error closing browser: ', error);
    }

    const usePKCE = true; //Platform.OS !== 'web';
    const request = new AppAuth.ExpoAuthorizationRequest(
      { ...currentService.config, responseType: AuthorizationRequest.RESPONSE_TYPE_CODE },
      undefined,
      usePKCE
    );
    // console.log('REQUEST: ', await request.toJson());
    // return;
    const authState = await AppAuth.authAsync(request, currentService.issuer);
    console.log('App.authAsync(): ', JSON.stringify(authState, null, 2));
    return authState as TokenResponse;
  }

  async function refreshAsync(): Promise<TokenResponse> {
    const authState = await AppAuth.refreshAsync(
      {
        ...currentService.config,
        refreshToken: auth?.refreshToken,
      },
      currentService.issuer
    );
    setAuth(authState);
    return authState;
  }
  async function registerAsync() {
    setMessage('Initiating registration request');
    try {
      const registrationResponse = await AppAuth.registerAsync(
        {
          // @ts-ignore
          response_types: undefined,
          // @ts-ignore
          grant_types: undefined,
          subject_type: undefined,
          token_endpoint_auth_method: 'client_secret_post',
          redirect_uris: [kRedirectURI],
        },
        currentService.issuer
      );
      setMessage('Got registration response: ' + registrationResponse);
      return registrationResponse;
    } catch (error) {
      setMessage('Registration error: ' + error);
    }
    // setAuth(authState);
  }

  async function doAuthWithAutoCodeExchange(clientId: string, clientSecret?: string): Promise<any> {
    const scopes = ['openid', 'profile'];
    setMessage('Initiating authorization request with scope: ' + scopes);

    const extras: Record<string, any> = {};

    if (clientSecret) extras.client_secret = clientSecret;

    try {
      const usePKCE = true; //Platform.OS !== 'web';
      const request = new AppAuth.ExpoAuthorizationRequest(
        {
          clientId,
          extras,
          scopes,
          redirectUri: kRedirectURI,
          responseType: AuthorizationRequest.RESPONSE_TYPE_CODE,
        },
        undefined,
        usePKCE
      );

      const authState = await AppAuth.authAsync(request, currentService.issuer);

      setMessage('Got authorization tokens.');
      console.log('Got authorization tokens. Access token: ', authState);
      setAuth(authState as TokenResponse);
    } catch (error) {
      setMessage('Authorization error: ' + error.message);
    }
    // setAuth(authState);
  }
  async function doAuthWithoutAutoCodeExchange(
    clientId: string,
    clientSecret?: string
  ): Promise<any> {
    const scopes = ['openid', 'profile'];
    setMessage('Initiating authorization request with scope: ' + scopes);
    try {
      const usePKCE = true; //Platform.OS !== 'web';
      const request = new AppAuth.ExpoAuthorizationRequest(
        {
          clientId,
          extras: {
            // @ts-ignore
            client_secret: clientSecret,
          },
          scopes,
          redirectUri: kRedirectURI,
          responseType: AuthorizationRequest.RESPONSE_TYPE_CODE,
        },
        undefined,
        usePKCE
      );

      const authState = await AppAuth.authRequestAsync(request, currentService.issuer);

      setMessage('Got authorization tokens.');
      console.log('Got authorization tokens. Access token:', authState);
      setAuthResponse(authState);
    } catch (error) {
      setMessage('Authorization error: ' + error.message);
      setAuthResponse(null);
    }
    // setAuth(authState);
  }

  // Determines whether a token refresh request must be made to refresh the tokens
  function isTokenFresh(): boolean {
    if (!auth) {
      return false;
    }
    if (!auth.expiresIn) {
      // if there is no expiration time but we have an access token, it is assumed to never expire
      return !!auth.accessToken;
    }

    const timeLeft = tokenExpirationTimeLeft(auth);
    return timeLeft > kExpiryTimeTolerance;
  }

  async function getFreshTokensAsync(): Promise<TokenResponse> {
    if (isTokenFresh()) {
      return auth!;
    }

    if (!auth?.refreshToken) {
      // no refresh token available and token has expired
      throw new Error('Unable to refresh expired token without a refresh token.');
    }

    return await refreshAsync();
  }

  async function codeExchangeAsync(clientId: string, clientSecret?: string): Promise<any> {
    const scopes = ['openid', 'profile'];
    console.log('Initiating authorization request with scope', scopes);
    try {
      const authState = await AppAuth.exchangeAsync(
        {
          clientId,
          clientSecret,
          scopes,
          redirectUri: kRedirectURI,
          code: authResponse.code,
          // TODO: Maybe need client secret and code verifier
        },
        currentService.issuer
      );
      console.log('Got authorization tokens. Access token:', authState);
      setAuth(authState);
    } catch (error) {
      console.log('Authorization error', error);
    }
    // setAuth(authState);
  }

  const getUserInfoAsync = async () => {
    if (!auth) {
      setMessage('cannot get user info without a valid access token');
      return;
    }
    const serviceConfig = await serviceConfigFromPropsAsync(currentService.issuer);
    console.log('get user info from service config: ', serviceConfig);
    // @ts-ignore: TODO
    const userinfoEndpoint = serviceConfig.discoveryDocument.userinfo_endpoint;

    if (!userinfoEndpoint) {
      console.log('User info endpoint is not declared in the service config discovery document');
      return;
    }
    const currentAccessToken = auth.accessToken;
    console.log('Performing userinfo request');
    try {
      const freshAuth = await getFreshTokensAsync();

      // log whether a token refresh occurred
      if (currentAccessToken !== freshAuth.accessToken) {
        setMessage(
          `Access token was refreshed automatically (${currentAccessToken} to ${freshAuth.accessToken})`
        );
      } else {
        setMessage(`Access token was fresh and not updated [${freshAuth.accessToken}]`);
      }

      // creates request to the userinfo endpoint, with access token in the Authorization header
      try {
        const response = await fetch(userinfoEndpoint, {
          headers: {
            Authorization: `Bearer ${freshAuth.accessToken}`,
          },
        });
        const data = await response.json();

        if (response.status !== 200) {
          // server replied with an error
          if (response.status === 401) {
            // "401 Unauthorized" generally indicates there is an issue with the authorization
            // grant.
            // throw new Error(data)
            // log error
            setMessage(`Authorization Error. Response: ${data}`);
          } else {
            setMessage(`HTTP: ${response.status}. Response: ${data}`);
          }
          return;
        }
        console.log('User: ', data);
        setMessage(`Success: ${data}`);
      } catch (error) {
        setMessage(`HTTP request failed ${error.message}`);
      }
    } catch (error) {
      console.log('Error fetching fresh tokens: ', error);
    }
  };

  if (!service) return <View />;

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
          <JsonView title="Service" data={currentService?.config} />

          <Text>Message: {message}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="Auth" onPress={async () => setAuth(await signInAsync())} />
            <Button title="Refresh" onPress={() => refreshAsync()} />
            <Button title="Revoke" onPress={() => signOutAsync(auth)} />
            <Button title="Get User Info" onPress={() => getUserInfoAsync()} />
          </View>
          <View>
            <Text>Auth with auth code exchange</Text>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Button
                title="Register, auth, and auto exchange"
                onPress={async () => {
                  const registration = await registerAsync();
                  await doAuthWithAutoCodeExchange(
                    registration.clientID,
                    registration.clientSecret
                  );
                }}
              />
              <Button
                title="Exchange with client ID, auth, and auto exchange"
                onPress={() => doAuthWithAutoCodeExchange(currentService.config.clientId)}
              />
            </View>
          </View>
          <View>
            <Text>Auth without code exchange</Text>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Button
                title="Register and auth"
                onPress={async () => {
                  const registration = await registerAsync();
                  await doAuthWithoutAutoCodeExchange(
                    registration.clientID,
                    registration.clientSecret
                  );
                }}
              />
              <Button
                title="Auth without exchange"
                onPress={() => doAuthWithoutAutoCodeExchange(currentService.config.clientId)}
              />
              <Button
                title="Exchange"
                onPress={() => codeExchangeAsync(currentService.config.clientId)}
              />
            </View>
          </View>
          <JsonView title="Auth" data={auth} />
          {auth && <Text>Expires at: {expiresInString(auth)}</Text>}
        </ScrollView>
        <ServicePicker />
      </SafeAreaView>
    </View>
  );
}

function JsonView({ title, data }: { title: string; data: null | Record<string, any> }) {
  return (
    <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 4 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{title}</Text>
      <Text>{data ? JSON.stringify(data, null, 2) : '[No Data]'}</Text>
    </View>
  );
}

async function serviceConfigFromPropsAsync(
  issuerOrServiceConfig: any
): Promise<AppAuth.ExpoAuthorizationServiceConfiguration> {
  if (typeof issuerOrServiceConfig === 'string') {
    return await AppAuth.ExpoAuthorizationServiceConfiguration.fetchFromIssuer(
      issuerOrServiceConfig
    );
  }
  return new AppAuth.ExpoAuthorizationServiceConfiguration(issuerOrServiceConfig);
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 48,
  },
  text: {
    marginVertical: 15,
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

export default class AppAuthScreen extends React.Component {
  static navigationOptions = {
    title: 'AppAuth',
  };

  render() {
    return (
      <ServiceProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ServiceProvider>
    );
  }
}
