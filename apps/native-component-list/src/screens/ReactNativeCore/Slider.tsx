import * as React from 'react';
import Slider from '@react-native-community/slider';
import { Text } from 'react-native';
import Colors from '../../constants/Colors';
import { Page, Section } from './CommonViews';

export function SliderExample() {
  const [value, setValue] = React.useState(0.5);

  return (
    <Page>
      <Section title="Standard">
        <Text>Value: {value && +value.toFixed(3)}</Text>
        <Slider onValueChange={setValue} />
      </Section>
      <Section title="Custom Color">
        <Text>Value: {value && +value.toFixed(3)}</Text>
        <Slider
          minimumTrackTintColor="red"
          maximumTrackTintColor={Colors.tintColor}
          onValueChange={setValue}
          thumbTintColor="gold"
        />
      </Section>
    </Page>
  );
}
