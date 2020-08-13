import * as React from 'react';
import { Text } from 'react-native';

import { Page, Section } from '../components/Page';
import Colors from '../constants/Colors';

export default function TextScreen() {
  const linkStyle = { color: Colors.tintColor, marginVertical: 3 };

  return (
    <Page>
      <Section title="Default">
        <Text>
          All text in React Native on Android uses the native text component and supports a bunch of
          useful properties.
        </Text>
        <Text style={linkStyle} onPress={() => alert('pressed!')}>
          Press on this!
        </Text>
        <Text numberOfLines={1} ellipsizeMode="tail">
          It's easy to limit the number of lines that some text can span and ellipsize it
        </Text>
      </Section>
    </Page>
  );
}

TextScreen.navigationOptions = {
  title: 'Text',
};
