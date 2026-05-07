import { Slider } from '@expo/ui/community/slider';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { ScrollPage, Section } from '../../components/Page';

export default function CommunitySliderScreen() {
  return (
    <ScrollPage>
      <Section title="Standard">
        <BasicSlider />
      </Section>

      <Section title="Styled (width, padding)">
        <BasicSlider style={{ width: 240, padding: 8 }} />
      </Section>

      <Section title="Custom range (minimumValue=0, maximumValue=100)">
        <RangedSlider minimumValue={0} maximumValue={100} initial={42} />
      </Section>

      <Section title="Negative range (minimumValue=-1, maximumValue=1)">
        <RangedSlider minimumValue={-1} maximumValue={1} initial={0} />
      </Section>
    </ScrollPage>
  );
}

CommunitySliderScreen.navigationOptions = {
  title: 'Community Slider',
};

function BasicSlider({ style }: { style?: React.ComponentProps<typeof Slider>['style'] }) {
  const [value, setValue] = useState(0.5);

  return (
    <>
      <Slider value={value} onValueChange={setValue} style={style} />
      <Text>Value: {value.toFixed(3)}</Text>
    </>
  );
}

function RangedSlider({
  minimumValue,
  maximumValue,
  initial,
}: {
  minimumValue: number;
  maximumValue: number;
  initial: number;
}) {
  const [value, setValue] = useState(initial);

  return (
    <>
      <Slider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        onValueChange={setValue}
      />
      <Text>Value: {value.toFixed(3)}</Text>
    </>
  );
}
