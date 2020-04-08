import { B } from '@expo/html-elements';
import * as Application from 'expo-application';
import { getRedirectUrl, AuthRequest, useDiscovery, useAuthRequest } from 'expo-auth-session';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../components/Button';

const GUID = '629683148649-29390lifpv9kcp042bc23877isouoviq';

const G_PROJECT_ID = `${GUID}.apps.googleusercontent.com`;

export default function AuthSessionScreen() {
  const [result, setResult] = React.useState<null | any>(null);
  const [useProxy, setProxy] = React.useState<boolean>(false);

  const redirectUri = React.useMemo(
    () =>
      Platform.select({
        web: getRedirectUrl('redirect'),
        default: useProxy ? getRedirectUrl() : `${Application.applicationId}://redirect`,
      }),
    [useProxy]
  );

  const googleRedirectUri = React.useMemo(
    () =>
      Platform.select({
        web: getRedirectUrl('redirect'),
        default: useProxy ? getRedirectUrl() : `com.googleusercontent.apps.${GUID}:/oauthredirect`,
      }),
    [useProxy]
  );

  const spotifyDiscovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
  };

  const spotifyRequest = useAuthRequest(
    {
      clientId: 'cc809bf3e0a74f288c01fe14c3f3fbb3',
      redirectUri,
      scopes: ['user-read-email', 'playlist-modify-public', 'user-read-private'],
      clientSecret: 'a45500e2a01d48b4939727846ff5ab24',
    },
    spotifyDiscovery
  );

  const identityDiscovery = useDiscovery('https://demo.identityserver.io');

  const identityRequest = useAuthRequest(
    {
      clientId: 'native.code',
      redirectUri,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      clientSecret: 'a45500e2a01d48b4939727846ff5ab24',
    },
    identityDiscovery
  );

  const googleDiscovery = useDiscovery('https://accounts.google.com');

  const googleRequest = useAuthRequest(
    {
      clientId: G_PROJECT_ID,
      redirectUri: googleRedirectUri,
      scopes: ['profile', 'email', 'openid'],
    },
    googleDiscovery
  );

  /*
  AuthRequest.loadAsync({
    clientId: G_PROJECT_ID,
    redirectUri: googleRedirectUri,
    scopes: ['profile', 'email', 'openid'],
  }, 'https://accounts.google.com').then(request => {

  })
  */

  return (
    <ScrollView style={{ flex: 1 }}>
      {Platform.OS !== 'web' && (
        <TitleSwitch title="Use Proxy" value={useProxy} setValue={setProxy} />
      )}
      <Button
        title="Spotify"
        buttonStyle={styles.button}
        onPress={async () => {
          setResult(
            await spotifyRequest.promptAsync({
              useProxy,
            })
          );
        }}
      />
      <Button
        title="Identity"
        buttonStyle={styles.button}
        onPress={async () => {
          setResult(
            await identityRequest.promptAsync({
              useProxy,
            })
          );
        }}
      />
      <Button
        title="Google"
        buttonStyle={styles.button}
        onPress={async () => {
          setResult(
            await googleRequest.promptAsync({
              useProxy,
            })
          );
        }}
      />
      {result ? <Text style={styles.text}>Result: {JSON.stringify(result, null, 2)}</Text> : null}
    </ScrollView>
  );
}

function TitleSwitch({ title, value, setValue }: any) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        justifyContent: 'space-between',
      }}>
      <B style={{ marginRight: 12 }}>{title}</B>
      <Switch value={value} onValueChange={value => setValue(value)} />
    </View>
  );
}

AuthSessionScreen.navigationOptions = {
  title: 'AuthSession',
};

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
});
