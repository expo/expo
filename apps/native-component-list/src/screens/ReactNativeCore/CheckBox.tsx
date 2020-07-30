import * as React from 'react';
import { CheckBox } from 'react-native';

import Colors from '../../constants/Colors';
import { Page, Section } from './CommonViews';

export function CheckBoxExample() {
  const [value, setValue] = React.useState(true);

  return (
    <Page>
      <Section title="Custom Color">
        <CheckBox value={value} onValueChange={setValue} color={Colors.tintColor} />
      </Section>
      <Section title="Disabled">
        <CheckBox disabled value={value} />
      </Section>
      <Section title="Larger">
        <CheckBox value={value} onValueChange={setValue} style={{ height: 32, width: 32 }} />
      </Section>
    </Page>
  );
}
