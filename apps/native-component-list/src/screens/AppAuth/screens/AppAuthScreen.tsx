import './side-effects';

import { B, H2, H4, HR, Table, TBody, TD, TR } from '@expo/html-elements';
import { AuthorizationRequest, TokenResponse } from '@openid/appauth';
import * as AppAuth from 'expo-app-auth';
import { ExpoAuthorizationRequestJson } from 'expo-app-auth';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../../../components/Button';
import {
  clearQueryParams,
  expiresInString,
  getUserInfoAsync,
  shouldRefreshTokensAsync,
  useRedirectAutoExchange,
  useQueryParams,
  useRedirectCompleteAuth,
  useLinking,
  usePrepareWebBrowser,
} from '../AppAuthUtils';
import FloatingActionButton from '../components/FloatingActionButton';
import Services from '../constants/Services';
import AuthContext from '../context/AuthContext';
import AuthProvider from '../context/AuthProvider';
import ServiceContext from '../context/ServiceContext';
import ServiceProvider from '../context/ServiceProvider';

function RedirectAuthHandlerApp({ children }: any) {
  const { service } = React.useContext(ServiceContext);
  console.log('RedirectAuthHandlerApp: ', service);
  const { token, error } = useRedirectAutoExchange(Services[service].issuer);
  const { setAuth } = React.useContext(AuthContext);

  React.useEffect(() => {
    if (token) {
      setAuth(token);
      clearQueryParams();
    }
  }, [token]);

  React.useEffect(() => {
    if (error) {
      alert('Redirect Auth Error: ' + JSON.stringify(error.toJson()));
    }
  }, [error]);

  return children;
}

function App() {
  const { service } = React.useContext(ServiceContext);
  const { auth, setAuth } = React.useContext(AuthContext);

  const [message, setMessage] = React.useState<string>('');
  const currentService = JSON.parse(JSON.stringify(Services[service]));
  const [usePKCE, setPKCE] = React.useState<boolean>(true);
  const serviceConfig = currentService?.issuer; //useServiceConfig(currentService.issuer);

  usePrepareWebBrowser();

  async function signOutAsync(authState: any) {
    try {
      await AppAuth.revokeAsync(
        { ...currentService.config, token: authState.accessToken, tokenTypeHint: 'access_token' },
        serviceConfig!
      );
      setAuth(null);
    } catch (error) {
      console.log('Error revoking: ', error);
      setMessage('Failed to revoke token: ' + error.message);
    }
  }

  async function signInAsync(): Promise<TokenResponse | null> {
    const request = new AppAuth.ExpoAuthorizationRequest(
      { ...currentService.config, responseType: AuthorizationRequest.RESPONSE_TYPE_CODE },
      undefined,
      usePKCE
    );
    try {
      const authState = await AppAuth.authAndExchangeAsync(request, serviceConfig!);
      return authState as TokenResponse;
    } catch (error) {
      setMessage(`Failed to sign in: ${error.message}`);
      return auth;
    }
  }

  async function refreshAsync(): Promise<TokenResponse | null> {
    if (!shouldRefreshTokensAsync(auth)) {
      return null;
    }
    const authState = await AppAuth.refreshAsync(
      {
        ...currentService.config,
        refreshToken: auth?.refreshToken,
      },
      serviceConfig!
    );
    setAuth(authState);
    return authState;
  }

  if (!service || !serviceConfig) return <View />;

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
          <Button disabled={!auth?.refreshToken} title="Refresh" onPress={() => refreshAsync()} />
          <Button title="Log Out" onPress={() => signOutAsync(auth)} />
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

export default class AppAuthScreen extends React.Component {
  static navigationOptions = {
    title: 'AppAuth',
  };

  render() {
    return (
      <ServiceProvider>
        <AuthProvider>
          <FloatingActionButton>
            <RedirectAuthHandlerApp>
              <App />
            </RedirectAuthHandlerApp>
          </FloatingActionButton>
        </AuthProvider>
      </ServiceProvider>
    );
  }
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
