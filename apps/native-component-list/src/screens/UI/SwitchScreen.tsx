import { Switch } from '@expo/ui/components/Switch';
import * as React from 'react';

import { Page, Section } from '../../components/Page';

export default function SwitchScreen() {
  const [checked, setChecked] = React.useState<boolean>(true);
  return (
    <Page>
      <Section title="Switch">
        <Switch
          value={checked}
          style={{ width: 300, height: 50 }}
          onValueChange={setChecked}
          color="#ff0000"
          label="Never gonna give you up"
          variant="switch"
        />
      </Section>
      <Section title="Checkbox Switch">
        <Switch
          value={checked}
          style={{ width: 300, height: 50 }}
          onValueChange={setChecked}
          label="Never gonna let you down"
          color="#ff0000"
          variant="checkbox"
        />
      </Section>
      <Section title="Button Switch">
        <Switch
          value={checked}
          style={{ width: 300, height: 50 }}
          onValueChange={setChecked}
          label="Never gonna run around and desert you"
          variant="button"
        />
      </Section>
    </Page>
  );
}

SwitchScreen.navigationOptions = {
  title: 'Switch',
};
