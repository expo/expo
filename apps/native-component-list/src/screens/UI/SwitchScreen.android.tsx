import { Host, Switch } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { View } from 'react-native';

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

      <Section title="Switch with Custom Colors">
        <Host matchContents>
          <Switch
            value={checked}
            onValueChange={setChecked}
            label="Never gonna let you down"
            variant="switch"
            elementColors={{
              checkedBorderColor: '#7C3AED',
              uncheckedBorderColor: '#D1D5DB',
              checkedTrackColor: '#EDE9FE',
              uncheckedTrackColor: '#F3F4F6',
              checkedIconColor: '#7C3AED',
              uncheckedIconColor: '#9CA3AF',
              checkedThumbColor: '#7C3AED',
              uncheckedThumbColor: '#9CA3AF',
            }}>
            <Switch.ThumbContent>
              <View
                style={{
                  width: Switch.DefaultIconSize,
                  height: Switch.DefaultIconSize,
                  borderRadius: Switch.DefaultIconSize / 2,
                  backgroundColor: checked ? '#ffffff' : '#E5E7EB',
                }}
              />
            </Switch.ThumbContent>
          </Switch>
        </Host>
      </Section>

      <Section title="Disabled Switch">
        <Host matchContents>
          <Switch
            value={checked}
            enabled={false}
            label="Never gonna run around and desert you"
            variant="switch"
          />
        </Host>
      </Section>

      <Section title="Disabled Switch with Custom Colors">
        <Host matchContents>
          <Switch
            value={checked}
            enabled={false}
            label="Never gonna make you cry"
            variant="switch"
            elementColors={{
              disabledUncheckedThumbColor: '#F87171',
              disabledUncheckedTrackColor: '#FEE2E2',
              disabledUncheckedBorderColor: '#FCA5A5',
              disabledCheckedThumbColor: '#34D399',
              disabledCheckedTrackColor: '#D1FAE5',
              disabledCheckedBorderColor: '#6EE7B7',
            }}
          />
        </Host>
      </Section>

      <Section title="Checkbox Switch">
        <Host matchContents>
          <Switch
            value={checked}
            onValueChange={setChecked}
            label="Never gonna say goodbye"
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
            label="Never gonna tell a lie and hurt you"
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
