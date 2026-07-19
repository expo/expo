import Slider from '@react-native-community/slider';
import * as React from 'react';

import { BodyText } from '../components/BodyText';
import { Page, Section } from '../components/Page';
import Colors from '../constants/Colors';

export default function SliderScreen() {
  const [value, setValue] = React.useState(0.5);

  return (
    <Page>
      <Section title="Standard">
        <BodyText>Value: {value && +value.toFixed(3)}</BodyText>
        <Slider value={value} onValueChange={setValue} />
      </Section>
      <Section title="Custom Color">
        <BodyText>Value: {value && +value.toFixed(3)}</BodyText>
        <Slider
          value={value}
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
