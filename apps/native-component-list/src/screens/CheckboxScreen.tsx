import Checkbox from 'expo-checkbox';
import * as React from 'react';
import { Platform, Text } from 'react-native';

import { Page, Section } from '../components/Page';
import { useResolvedValue } from '../utilities/useResolvedValue';

export default function CheckboxScreen() {
  const [isAvailable] = useResolvedValue(Checkbox.isAvailableAsync);
  const [value, setValue] = React.useState(true);

  if (isAvailable === null) {
    return (
      <Page>
        <Text>Checking if checkbox is available on this platform...</Text>
      </Page>
    );
  }

  if (isAvailable === false) {
    return (
      <Page>
        <Text>CheckBox is not available on this platform.</Text>
      </Page>
    );
  }

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
