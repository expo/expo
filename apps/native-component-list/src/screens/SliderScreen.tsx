import Slider from '@react-native-community/slider';
import * as React from 'react';
import { Text } from 'react-native';

import { Page, Section } from '../components/Page';
import Colors from '../constants/Colors';

export default function SliderScreen() {
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

SliderScreen.navigationOptions = {
  title: 'Slider',
};
