import { Slider } from '@expo/ui/components/Slider';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function SliderScreen() {
  const [value, setValue] = React.useState(0);
  return (
    <Page>
      <Section title="Regular slider">
        <Slider
          style={{ minHeight: 60 }}
          value={value}
          onValueChanged={({ nativeEvent: { value } }) => {
            setValue(value);
          }}
        />
      </Section>
      <Section title="Stepped slider">
        <Slider
          style={{ minHeight: 60 }}
          value={value}
          steps={5}
          onValueChanged={({ nativeEvent: { value } }) => {
            setValue(value);
          }}
        />
      </Section>
      <Section title="Colorful slider">
        <Slider
          style={{ minHeight: 60 }}
          value={value}
          colors={{
            thumbColor: '#ff0000',
            activeTrackColor: '#ffff00',
            inactiveTrackColor: '#ff00ff',
            activeTickColor: '#ff0000',
            inactiveTickColor: '#00ff00',
          }}
          onValueChanged={({ nativeEvent: { value } }) => {
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
