import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { DocItem, Section } from '../ui-explorer';

const url = 'https://mathiasbynens.github.io/rel-noopener/malicious.html';
export const title = 'Linking';
export const label = 'Linking';

export const packageJson = require('expo/package.json');
export const description =
  'Linking gives you a general interface for securely opening external URLs from JavaScript.';

export default class OpenURL extends React.PureComponent {
  handlePress() {
    Linking.canOpenURL(url).then(supported => {
      return Linking.openURL(url);
    });
  }

  render() {
    return (
      <View>
        <Text onPress={this.handlePress} style={styles.text}>
          Linking.openURL
        </Text>
        <Text accessibilityRole="link" href={url} style={styles.text} target="_blank">
          target="_blank"
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    borderRadius: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    marginVertical: 10,
    padding: 10,
  },
});

export const component = () => (
  <Section title="Methods">
    <DocItem name="canOpenURL" typeInfo="(url) => Promise<true>" />

    <DocItem name="getInitialURL" typeInfo="() => Promise<string>" />

    <DocItem
      name="openURL"
      typeInfo="(url: string) => Promise<>"
      description="Try to open the given url in a secure fashion. The method returns a Promise object. If the url opens, the promise is resolved. If not, the promise is rejected."
      example={{
        render: () => <OpenURL />,
      }}
    />
  </Section>
);
