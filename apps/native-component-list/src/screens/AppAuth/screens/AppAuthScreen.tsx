import './side-effects';

import { H2, H4, B, Table, TR, TD, THead, TBody, HR } from '@expo/html-elements';
import { ActionSheetProvider, connectActionSheet } from '@expo/react-native-action-sheet';
import { AuthorizationNotifier, AuthorizationRequest, TokenResponse } from '@openid/appauth';
import * as AppAuth from 'expo-app-auth';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Switch,
  View,
  TouchableOpacity,
} from 'react-native';

import Button from '../../../components/Button';
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
  // Get the full URL.
  const currURL = window.location.href;

  const url = new URL(currURL);
  // Append the pathname to the origin (i.e. without the search).
  const nextUrl = url.origin + url.pathname;

  // Here you pass the new URL extension you want to appear after the domains '/'. Note that the previous identifiers or "query string" will be replaced.
  window.history.pushState({}, document.title, nextUrl);
}

const kRedirectURI = 'io.identityserver.demo:/oauth2redirect/example-provider';

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
  const [browser, setBrowser] = React.useState<string | null>(null);

  // Warm browser on Android
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      WebBrowser.getCustomTabsSupportingBrowsersAsync().then(value => {
        if (value.browserPackages.length) {
          WebBrowser.warmUpAsync(value.browserPackages[0]).then(() => {
            setBrowser(value.browserPackages[0]);
          });
        }
      });
    }
    return () => {
      if (Platform.OS === 'android' && browser) {
        WebBrowser.coolDownAsync(browser);
      }
    };
  }, []);

  const { auth, setAuth } = React.useContext(AuthContext);
  const [authResponse, setAuthResponse] = React.useState<any>(null);
  const [message, setMessage] = React.useState<string>('');
  const { service } = React.useContext(ServiceContext);
  const currentService = Services[service];
  const { response, error } = useAuthCode(currentService?.issuer);
  const [usePKCE, setPKCE] = React.useState<boolean>(true);
  const [
    serviceConfig,
    setServiceConfig,
  ] = React.useState<AppAuth.ExpoAuthorizationServiceConfiguration | null>(null);

  React.useEffect(() => {
    serviceConfigFromPropsAsync(currentService.issuer).then(value => {
      setServiceConfig(value);
    });
  }, [service]);

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
    // try {
    //   await WebBrowser.dismissAuthSession();
    // } catch (error) {
    //   console.log('weird error closing browser: ', error);
    // }

    const request = new AppAuth.ExpoAuthorizationRequest(
      { ...currentService.config, responseType: AuthorizationRequest.RESPONSE_TYPE_CODE },
      undefined,
      usePKCE
    );
    // console.log('REQUEST: ', await request.toJson());
    // return;
    const authState = await AppAuth.authAndExchangeAsync(request, currentService.issuer);
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
    const serviceConfig = await serviceConfigFromPropsAsync(currentService.issuer);

    setMessage('Initiating registration request: ' + serviceConfig.registrationEndpoint);
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
        serviceConfig
      );
      setMessage('Got registration response: ' + registrationResponse);
      return registrationResponse;
    } catch (error) {
      console.log('Registration error: ', error);
      setMessage('Registration error: ' + error.errorDescription ?? error.error);
    }
    // setAuth(authState);
  }

  async function doAuthWithAutoCodeExchange(clientId: string, clientSecret?: string): Promise<any> {
    const scopes = ['openid', 'profile'];
    setMessage('Initiating authorization request with scope: ' + scopes);

    const extras: Record<string, any> = {};

    if (clientSecret) extras.client_secret = clientSecret;

    try {
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

      const authState = await AppAuth.authAndExchangeAsync(request, currentService.issuer);

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
        setMessage(`Success:\n${JSON.stringify(data, null, 2)}`);
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <H2 style={{ marginVertical: 8 }}>{service}</H2>
        <H4 style={{ marginTop: 0, marginBottom: 16, opacity: 0.75 }}>
          {auth ? 'Logged in ✅' : 'Logged out'}
        </H4>
        <HR />
        <RequestView config={currentService.config} />
        <Text style={{ marginBottom: 16 }}>Message: {message}</Text>
        <HR />
        <H4 style={{ marginTop: 0, marginBottom: 8, opacity: 0.75 }}>Actions</H4>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button title="Log In" onPress={async () => setAuth(await signInAsync())} />
          <Button title="Refresh" onPress={() => refreshAsync()} />
          <Button
            disabled={serviceConfig?.revocationEndpoint == null}
            title="Log Out"
            onPress={() => signOutAsync(auth)}
          />
          <Button
            disabled={serviceConfig?.userInfoEndpoint == null}
            title="Get User Info"
            onPress={() => getUserInfoAsync()}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 12,
            justifyContent: 'space-between',
          }}>
          <B>Should use PKCE</B>
          <Switch value={usePKCE} onValueChange={value => setPKCE(value)} />
        </View>
        <View style={{ marginVertical: 8 }}>
          <H4 style={{ marginTop: 0, marginBottom: 8, opacity: 0.75 }}>Complex Actions</H4>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Button
              style={{ marginBottom: 8 }}
              title="Auth"
              onPress={() => doAuthWithoutAutoCodeExchange(currentService.config.clientId)}
            />
            <Button
              style={{ marginBottom: 8 }}
              title="Exchange"
              onPress={() => codeExchangeAsync(currentService.config.clientId)}
            />
            <Button
              style={{ marginBottom: 8 }}
              title="Auth > Exchange"
              onPress={() => doAuthWithAutoCodeExchange(currentService.config.clientId)}
            />
            <Button
              style={{ marginBottom: 8 }}
              disabled={serviceConfig?.registrationEndpoint == null}
              title="Register > Auth"
              onPress={async () => {
                const registration = await registerAsync();
                await doAuthWithoutAutoCodeExchange(
                  registration.clientId,
                  registration.clientSecret
                );
              }}
            />
            <Button
              style={{ marginBottom: 8 }}
              disabled={serviceConfig?.registrationEndpoint == null}
              title="Register > Auth > Exchange"
              onPress={async () => {
                const registration = await registerAsync();
                await doAuthWithAutoCodeExchange(registration.clientId, registration.clientSecret);
              }}
            />
          </View>
        </View>

        <AuthView auth={auth} />
      </ScrollView>
    </View>
  );
}

function RequestView({ config }: { config: ExpoAuthorizationRequestJson | null }) {
  if (!config) return null;

  return (
    <View>
      <H4 style={{ marginTop: 0, marginBottom: 16, opacity: 0.75 }}>Login Provider</H4>
      <Table style={{ borderWidth: StyleSheet.hairlineWidth }}>
        <TBody>
          {Object.keys(config).map((key, index) => {
            // @ts-ignore
            const item = config[key];
            return (
              <TR
                key={key}
                style={{
                  padding: 2,
                  backgroundColor: index % 2 === 0 ? 'transparent' : 'white',
                }}>
                <TD>{key}</TD>
                <TD>{typeof item === 'string' ? item : JSON.stringify(item)}</TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </View>
  );
}

function AuthView({ auth }: { auth: TokenResponse | null }) {
  if (!auth) return null;

  return (
    <View>
      <H2 style={{ marginVertical: 8 }}>Auth Info</H2>
      <H4 style={{ marginTop: 0, marginBottom: 16, opacity: 0.75 }}>
        Expires at: {expiresInString(auth)}
      </H4>
      <Table style={{ borderWidth: StyleSheet.hairlineWidth }}>
        <TBody>
          {Object.keys(auth).map((key, index) => {
            // @ts-ignore
            const item = auth[key];
            return (
              <TR
                key={key}
                style={{
                  padding: 2,
                  backgroundColor: index % 2 === 0 ? 'transparent' : 'white',
                }}>
                <TD>{key}</TD>
                <TD>{typeof item === 'string' ? item : JSON.stringify(item)}</TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </View>
  );
}

Linking.addEventListener('url', event => {
  console.log('general linking: ', event);
});

let serviceConfigCache: Record<string, AppAuth.ExpoAuthorizationServiceConfiguration> = {};

async function serviceConfigFromPropsAsync(
  issuerOrServiceConfig: any
): Promise<AppAuth.ExpoAuthorizationServiceConfiguration> {
  if (typeof issuerOrServiceConfig === 'string') {
    if (issuerOrServiceConfig in serviceConfigCache)
      return serviceConfigCache[issuerOrServiceConfig];

    const config = await AppAuth.ExpoAuthorizationServiceConfiguration.fetchFromIssuer(
      issuerOrServiceConfig
    );
    serviceConfigCache[issuerOrServiceConfig] = config;
    return config;
  }
  return new AppAuth.ExpoAuthorizationServiceConfiguration(issuerOrServiceConfig);
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 72,
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

import { MaterialIcons } from '@expo/vector-icons';
import { ExpoAuthorizationRequestJson } from 'expo-app-auth';

function FloatingActionButton({ showActionSheetWithOptions }: any) {
  const { setService } = React.useContext(ServiceContext);
  const size = 64;

  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
      }}
      onPress={() => {
        const options = [...Object.keys(Services), 'Cancel'];
        const cancelButtonIndex = options.length - 1;
        showActionSheetWithOptions({ options, cancelButtonIndex }, (index: number) => {
          if (index < cancelButtonIndex) {
            setService(options[index]);
          }
        });
      }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.23,
          shadowRadius: 2.62,
          elevation: 4,
        }}>
        <MaterialIcons size={size * 0.5} color={'black'} name="https" />
      </View>
    </TouchableOpacity>
  );
}

const FloatingActionButtonActionSheet = connectActionSheet(FloatingActionButton);

function FloatingActionScreen({ children }: any) {
  return (
    <View style={{ flex: 1 }}>
      {children}
      <FloatingActionButtonActionSheet />
    </View>
  );
}

export default class AppAuthScreen extends React.Component {
  static navigationOptions = {
    title: 'AppAuth',
  };

  render() {
    return (
      <ServiceProvider>
        <AuthProvider>
          <ActionSheetProvider>
            <FloatingActionScreen>
              <App />
            </FloatingActionScreen>
          </ActionSheetProvider>
        </AuthProvider>
      </ServiceProvider>
    );
  }
}
