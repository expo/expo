import { Slider } from '@expo/ui/swift-ui';
import * as React from 'react';

import { Page, Section } from '../../components/Page';

export default function SliderScreen() {
  const [value, setValue] = React.useState(0);
  return (
    <Page>
      <Section title="Regular slider">
        <Slider
          style={{ minHeight: 60 }}
          value={value}
          onValueChange={(value) => {
            setValue(value);
          }}
        />
      </Section>
      <Section title="Stepped slider">
        <Slider
          style={{ minHeight: 60 }}
          value={value}
          steps={5}
          onValueChange={(value) => {
            setValue(value);
          }}
        />
      </Section>
      <Section title="Colorful slider">
        <Slider
          style={{ minHeight: 60 }}
          value={value}
          min={-1}
          max={5}
          color="#ff0000"
          onValueChange={(value) => {
            setValue(value);
          }}
        />
      </Section>
    </Page>
  );
}

SliderScreen.navigationOptions = {
  title: 'Slider',
};
