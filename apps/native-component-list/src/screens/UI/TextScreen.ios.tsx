import { Host, List, Text, Section } from '@expo/ui/swift-ui';
import * as React from 'react';

export default function TextScreen() {
  const textNumber = 123;
  const textString = 'Hello world';
  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Default">
          <Text>Hello world</Text>
        </Section>
        <Section title="Text number">
          <Text>{textNumber}</Text>
        </Section>
        <Section title="Text string">
          <Text>{textString}</Text>
        </Section>
      </List>
    </Host>
  );
}
TextScreen.navigationOptions = {
  title: 'Text',
};
