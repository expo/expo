import { Host, Slider } from '@expo/ui/jetpack-compose';
import * as React from 'react';

import { Page, Section } from '../../components/Page';

export default function SliderScreen() {
  const [value, setValue] = React.useState(0);
  return (
    <Page>
      <Section title="Regular slider">
        <Host>
          <Slider
            value={value}
            onValueChange={(value) => {
              setValue(value);
            }}
          />
        </Host>
      </Section>
      <Section title="Stepped slider">
        <Host>
          <Slider
            value={value}
            steps={5}
            onValueChange={(value) => {
              setValue(value);
            }}
          />
        </Host>
      </Section>
      <Section title="Colorful slider">
        <Host>
          <Slider
            value={value}
            min={-1}
            max={5}
            elementColors={{
              thumbColor: '#ff0000',
              activeTrackColor: '#ffff00',
              inactiveTrackColor: '#ff00ff',
              activeTickColor: '#ff0000',
              inactiveTickColor: '#00ff00',
            }}
            color="#ff0000"
            onValueChange={(value) => {
              setValue(value);
            }}
          />
        </Host>
      </Section>
    </Page>
  );
}

SliderScreen.navigationOptions = {
  title: 'Slider',
};
