import * as React from 'react';
import { Button } from 'react-native';

import { Page, Section } from '../components/Page';
import Colors from '../constants/Colors';

export default function ButtonScreen() {
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

ButtonScreen.navigationOptions = {
  title: 'Button',
};
