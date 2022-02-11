import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Button from 'src/components/Button';
import Configurator, { ConfiguratorChoiceType } from 'src/components/Configurator';
import HeadingText from 'src/components/HeadingText';
import MonoText from 'src/components/MonoText';
import { Colors } from 'src/constants';

const url = 'https://blog.expo.dev/expo-sdk-44-4c4b8306584a';

const openBrowserConfigurationChoices: ConfiguratorChoiceType[] = [
  {
    name: 'toolbarColor',
    title: `Use toolbarColor (${Colors.tintColor})`,
    initial: false,
    resolve: (checked) => (checked ? Colors.tintColor : undefined),
  },
  {
    name: 'secondaryToolbarColor',
    title: `Use secondaryToolbarColor (${Colors.highlightColor})`,
    platforms: ['android'],
    initial: false,
    resolve: (checked) => (checked ? Colors.highlightColor : undefined),
  },
  {
    name: 'controlsColor',
    title: `Use controlsColor (${Colors.headerTitle})`,
    initial: false,
    resolve: (checked) => (checked ? Colors.headerTitle : undefined),
  },
  {
    name: 'showTitle',
    title: 'Show title',
    platforms: ['android'],
    initial: false,
  },
  {
    name: 'showInRecents',
    title: 'Show in recents',
    platforms: ['android'],
    initial: false,
  },
  {
    name: 'enableBarCollapsing',
    title: 'Enable bar collapsing',
    initial: false,
  },
  {
    name: 'readerMode',
    title: 'Reader mode',
    platforms: ['ios'],
    initial: false,
  },
  {
    name: 'enableDefaultShareMenuItem',
    title: 'Enable default share menu item',
    platforms: ['android'],
    initial: false,
  },
];

export default function OpenBrowserAsyncDemo() {
  const [openOptions, setOpenOptions] = React.useState({});
  const openBrowser = React.useCallback(async () => {
    const result = await WebBrowser.openBrowserAsync(url, openOptions);
    alert(JSON.stringify(result, null, 2));
  }, [openOptions]);

  const openAndDismiss = React.useCallback(() => {
    WebBrowser.openBrowserAsync(url, openOptions);
    WebBrowser.dismissBrowser();
  }, [openOptions]);

  const openTwice = React.useCallback(async () => {
    WebBrowser.openBrowserAsync(url, openOptions);
    const result = await WebBrowser.openBrowserAsync(url, openOptions);
    if (result.type === WebBrowser.WebBrowserResultType.LOCKED) {
      alert('Opening the second browser was properly locked');
    } else {
      alert(`Opening the second browser unexpectedly returned type: ${result.type}`);
    }
  }, [openOptions]);

  return (
    <>
      <HeadingText>openBrowserAsync</HeadingText>
      <Configurator choices={openBrowserConfigurationChoices} onChange={setOpenOptions} />
      <MonoText>options: {JSON.stringify(openOptions, null, 2)}</MonoText>
      <View style={styles.buttons}>
        <Button style={styles.button} onPress={openBrowser} title="Open" />
        <Button style={styles.button} onPress={openAndDismiss} title="Open and dismiss" />
        <Button style={styles.button} onPress={openTwice} title="Open twice" />
        <Button style={styles.button} onPress={WebBrowser.dismissBrowser} title="Dismiss (no-op)" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    marginVertical: 10,
    marginHorizontal: 5,
    alignItems: 'flex-start',
  },
});
