import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { StyleSheet } from 'react-native';

import Button from '../../components/Button';
import Configurator, { ConfiguratorChoiceType } from '../../components/Configurator';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

const openAuthSessionConfigurationChoices: ConfiguratorChoiceType[] = [
  {
    name: 'shouldPrompt',
    title: 'Should prompt',
    initial: false,
  },
  {
    name: 'createTask',
    title: 'Create task',
    initial: true,
  },
];

export default function OpenAuthSessionAsyncDemo() {
  const [options, setOptions] = React.useState<{ shouldPrompt?: boolean; createTask?: boolean }>(
    {}
  );
  const [authResult, setAuthResult] = React.useState<WebBrowser.WebBrowserAuthSessionResult | null>(
    null
  );

  const openAuthSession = React.useCallback(async () => {
    const redirectUrl = Linking.makeUrl('redirect');
    const result = await WebBrowser.openAuthSessionAsync(
      `https://fake-auth.netlify.com?state=faker&redirect_uri=${encodeURIComponent(
        redirectUrl
      )}&prompt=${options.shouldPrompt ? 'consent' : 'none'}`,
      redirectUrl,
      { createTask: options.createTask }
    );

    setAuthResult(result);
  }, [options]);

  return (
    <>
      <HeadingText>openAuthSessionAsync</HeadingText>
      <Configurator choices={openAuthSessionConfigurationChoices} onChange={setOptions} />
      <Button style={styles.button} onPress={openAuthSession} title="Open web auth session" />
      {authResult && <MonoText>result: {JSON.stringify(authResult, null, 2)}</MonoText>}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
    alignItems: 'flex-start',
  },
});
