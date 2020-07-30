import * as React from 'react';
import { Button } from 'react-native';

import Colors from '../../constants/Colors';
import { Page, Section } from './CommonViews';

export function ButtonExample() {
  return (
    <Page>
      <Section title="Default">
        <Button title="Hello Universe" onPress={() => {}} />
      </Section>
      <Section title="Custom Color">
        <Button color={Colors.tintColor} title="Blurple" onPress={() => {}} />
      </Section>
      <Section title="Disabled">
        <Button disabled title="Disabled" onPress={() => {}} />
      </Section>
    </Page>
  );
}
