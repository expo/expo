import { Host, Slider } from '@expo/ui/swift-ui';
import * as React from 'react';

import { Page, Section } from '../../components/Page';

export default function SliderScreen() {
  const [value, setValue] = React.useState(0);
  return (
    <Page>
      <Section title="Regular slider">
        <Host matchContents>
          <Slider
            value={value}
            onValueChange={(value) => {
              setValue(value);
            }}
          />
        </Host>
      </Section>
      <Section title="Stepped slider">
        <Host matchContents>
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
        <Host matchContents>
          <Slider
            value={value}
            min={-1}
            max={5}
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
