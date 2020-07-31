import * as React from 'react';
import { Switch } from 'react-native';

import Colors from '../../constants/Colors';
import { Page, Section } from './CommonViews';
import { Platform } from '@unimodules/core';

export function SwitchExample() {
  const [value, setValue] = React.useState(true);

  return (
    <Page>
      <Section title="Custom Color">
        <Switch
          value={value}
          onValueChange={setValue}
          thumbColor={'gold'}
          trackColor={{ true: Colors.tintColor, false: 'red' }}
        />
      </Section>
      <Section title="Disabled">
        <Switch disabled value={value} />
      </Section>
      {Platform.OS === 'web' && (
        <Section title="Larger">
          <Switch value={value} onValueChange={setValue} style={{ height: 32, width: 128 }} />
        </Section>
      )}
    </Page>
  );
}
