import { Host, Switch } from '@expo/ui/jetpack-compose';
import * as React from 'react';

import { Page, Section } from '../../components/Page';

export default function SwitchScreen() {
  const [checked, setChecked] = React.useState<boolean>(true);
  return (
    <Page>
      <Section title="Switch">
        <Host matchContents>
          <Switch
            value={checked}
            onValueChange={setChecked}
            color="#ff0000"
            label="Never gonna give you up"
            variant="switch"
          />
        </Host>
      </Section>

      <Section title="Switch with Border Colors">
        <Host matchContents>
          <Switch
            value={checked}
            onValueChange={setChecked}
            label="Never gonna let you down"
            variant="switch"
            elementColors={{
              checkedBorderColor: '#0000ff',
              uncheckedBorderColor: '#ff0000',
              checkedTrackColor: '#e0e0ff',
              uncheckedTrackColor: '#ffe0e0',
            }}
          />
        </Host>
      </Section>

      <Section title="Checkbox Switch">
        <Host matchContents>
          <Switch
            value={checked}
            onValueChange={setChecked}
            label="Never gonna run around and desert you"
            color="#ff0000"
            variant="checkbox"
          />
        </Host>
      </Section>

      <Section title="Checkbox with Border Colors">
        <Host matchContents>
          <Switch
            value={checked}
            onValueChange={setChecked}
            label="Never gonna make you cry"
            variant="checkbox"
            elementColors={{
              checkedBorderColor: '#00cc00',
              uncheckedBorderColor: '#cc6600',
              checkedColor: '#e0ffe0',
              uncheckedColor: '#ffe0cc',
            }}
          />
        </Host>
      </Section>

      <Section title="Button Switch">
        <Host matchContents>
          <Switch
            value={checked}
            onValueChange={setChecked}
            label="Never gonna say goodbye"
            variant="button"
          />
        </Host>
      </Section>
    </Page>
  );
}

SwitchScreen.navigationOptions = {
  title: 'Switch',
};
