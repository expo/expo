import Checkbox from 'expo-checkbox';
import * as React from 'react';
import { Platform } from 'react-native';

import { Page, Section } from '../components/Page';

export default function CheckboxScreen() {
  const [value, setValue] = React.useState(true);

  return (
    <Page>
      <Section title="Default">
        <Checkbox value={value} onValueChange={setValue} />
      </Section>
      <Section title="Custom Color">
        <Checkbox value={value} onValueChange={setValue} color="#4630EB" />
      </Section>
      <Section title="Disabled">
        <Checkbox disabled value={value} />
      </Section>
      {Platform.OS === 'web' && (
        <Section title="Larger">
          <Checkbox value={value} onValueChange={setValue} style={{ height: 32, width: 32 }} />
        </Section>
      )}
    </Page>
  );
}

CheckboxScreen.navigationOptions = {
  title: 'Checkbox',
};
