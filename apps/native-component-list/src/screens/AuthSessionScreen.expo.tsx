import * as Application from 'expo-application';
import { getRedirectUrl, useAuthRequest, useDiscovery } from 'expo-auth-session';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import Button from '../components/Button';
import TitleSwitch from '../components/TitleSwitch';

const GUID = '629683148649-29390lifpv9kcp042bc23877isouoviq';

const G_PROJECT_ID = `${GUID}.apps.googleusercontent.com`;

export default function AuthSessionScreen() {
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

  const [, spotifyResult, spotifyPromptAsync] = useAuthRequest(
    {
      clientId: 'cc809bf3e0a74f288c01fe14c3f3fbb3',
      redirectUri,
      scopes: ['user-read-email', 'playlist-modify-public', 'user-read-private'],
      clientSecret: 'a45500e2a01d48b4939727846ff5ab24',
    },
    spotifyDiscovery
  );

  const identityDiscovery = useDiscovery('https://demo.identityserver.io');

  const [, identityResult, identityPromptAsync] = useAuthRequest(
    {
      clientId: 'native.code',
      redirectUri,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      clientSecret: 'a45500e2a01d48b4939727846ff5ab24',
    },
    identityDiscovery
  );

  const googleDiscovery = useDiscovery('https://accounts.google.com');

  const [, googleResult, googlePromptAsync] = useAuthRequest(
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
        onPress={() => spotifyPromptAsync({ useProxy })}
      />
      <Result title="Spotify" result={spotifyResult} />
      <Button
        title="Identity"
        buttonStyle={styles.button}
        onPress={() => identityPromptAsync({ useProxy })}
      />
      <Result title="Identity" result={identityResult} />
      <Button
        title="Google"
        buttonStyle={styles.button}
        onPress={() => googlePromptAsync({ useProxy })}
      />
      <Result title="Google" result={googleResult} />
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
