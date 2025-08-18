import { Host, Switch } from '@expo/ui/swift-ui';
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
      <Section title="Checkbox Switch">
        <Host matchContents>
          <Switch
            value={checked}
            onValueChange={setChecked}
            label="Never gonna let you down"
            color="#ff0000"
            variant="checkbox"
          />
        </Host>
      </Section>
      <Section title="Button Switch">
        <Host matchContents>
          <Switch
            value={checked}
            onValueChange={setChecked}
            label="Never gonna run around and desert you"
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
