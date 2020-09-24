import * as React from 'react';
import { CheckBox, Platform } from 'react-native';

import { Page, Section } from '../components/Page';

// TODO: Upgrade to @react-native-community/checkbox
export default function CheckBoxScreen() {
  const [value, setValue] = React.useState(true);

  return (
    <Page>
      <Section title="Custom Color">
        <CheckBox value={value} onValueChange={setValue} />
      </Section>
      <Section title="Disabled">
        <CheckBox disabled value={value} />
      </Section>
      {Platform.OS === 'web' && (
        <Section title="Larger">
          <CheckBox value={value} onValueChange={setValue} style={{ height: 32, width: 32 }} />
        </Section>
      )}
    </Page>
  );
}

CheckBoxScreen.navigationOptions = {
  title: 'CheckBox',
};
