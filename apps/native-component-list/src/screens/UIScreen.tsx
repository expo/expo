import { SingleChoiceSegmentedControlView, SliderView } from 'expo-ui';
import * as React from 'react';
import { Platform, Text } from 'react-native';

import { Page, Section } from '../components/Page';

export default function UIScreen() {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const [value, setValue] = React.useState<number>(0);

  return (
    <Page>
      <>
        <Section title="SingleChoiceSegmentedControlView">
          <Text>{['$', '$$', '$$$', '$$$$', 'unset'][selectedIndex ?? 5]}</Text>
          <SingleChoiceSegmentedControlView
            options={['$', '$$', '$$$', '$$$$']}
            selectedIndex={selectedIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setSelectedIndex(index);
            }}
            style={{
              width: 300,
              height: 100,
            }}
          />
        </Section>
        <Section title="Slider">
          <Text>{value}</Text>
          <SliderView
            value={value}
            onValueChanged={({ nativeEvent: { value } }) => {
              setValue(value);
            }}
            steps={3}
            min={0}
            max={8}
            style={{
              width: 300,
              height: 50,
            }}
          />
        </Section>
      </>
    </Page>
  );
}

UIScreen.navigationOptions = {
  title: 'Expo UI',
};
