import { Platform } from 'expo-modules-core';
import * as React from 'react';
import { Switch } from 'react-native';

import { Page, Section } from '../components/Page';
import Colors from '../constants/Colors';

export default function SwitchScreen() {
  const [value, setValue] = React.useState(true);

  return (
    <Page>
      <Section title="Custom Color" row>
        <Switch
          value={value}
          onValueChange={setValue}
          thumbColor="gold"
          trackColor={{ true: Colors.tintColor, false: 'red' }}
        />
      </Section>
      <Section title="Disabled" row>
        <Switch disabled value={value} />
      </Section>
      {Platform.OS === 'web' && (
        <Section title="Larger" row>
          <Switch value={value} onValueChange={setValue} style={{ height: 32, width: 128 }} />
        </Section>
      )}
    </Page>
  );
}

SwitchScreen.navigationOptions = {
  title: 'Switch',
};
