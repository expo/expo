import * as React from 'react';

import { Page, Section } from '../components/Page';
import Colors from '../constants/Colors';
import { BodyText } from '../components/BodyText';

export default function TextScreen() {
  const linkStyle = { color: Colors.tintColor, marginVertical: 3 };

  return (
    <Page>
      <Section title="Default">
        <BodyText>
          All text in React Native on Android uses the native text component and supports a bunch of
          useful properties.
        </BodyText>
        <BodyText style={linkStyle} onPress={() => alert('pressed!')}>
          Press on this!
        </BodyText>
        <BodyText numberOfLines={1} ellipsizeMode="tail">
          It's easy to limit the number of lines that some text can span and ellipsize it
        </BodyText>
      </Section>
    </Page>
  );
}

TextScreen.navigationOptions = {
  title: 'Text',
};
