import { Switch } from '@expo/ui';
import * as React from 'react';

import { Page, Section } from '../../components/Page';

export default function SwitchScreen() {
  const [checked, setChecked] = React.useState<boolean>(false);
  return (
    <Page>
      <Section title="Switch">
        <Switch
          checked={checked}
          style={{ width: 300, height: 50 }}
          onCheckedChanged={({ nativeEvent: { checked } }) => {
            setChecked(checked);
          }}
          label="Never gonna give you up"
          variant="switch"
        />
      </Section>
      <Section title="Checkbox Switch">
        <Switch
          checked={checked}
          style={{ width: 300, height: 50 }}
          onCheckedChanged={({ nativeEvent: { checked } }) => {
            setChecked(checked);
          }}
          label="Never gonna let you down"
          variant="checkbox"
        />
      </Section>
      <Section title="Button Switch">
        <Switch
          checked={checked}
          style={{ width: 300, height: 50 }}
          onCheckedChanged={({ nativeEvent: { checked } }) => {
            setChecked(checked);
          }}
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
