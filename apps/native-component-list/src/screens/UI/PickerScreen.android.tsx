import { Picker, Host } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function PickerScreen() {
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
  const options = ['$', '$$', '$$$', '$$$$'];
  return (
    <ScrollView>
      <Page>
        <Section title="Selected value">
          <Text>{[...options, 'unset'][selectedIndex ?? options.length]}</Text>
        </Section>
        <Section title="Segmented picker">
          <Host>
            <Picker
              options={options}
              selectedIndex={selectedIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedIndex(index);
              }}
              variant="segmented"
            />
          </Host>
        </Section>
        <Section title="Tinted picker">
          <Host>
            <Picker
              options={options}
              selectedIndex={selectedIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedIndex(index);
              }}
              color="#ff5500"
            />
          </Host>
        </Section>
        <Section title="Radio picker">
          <Host>
            <Picker
              options={options}
              selectedIndex={selectedIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedIndex(index);
              }}
              variant="radio"
            />
          </Host>
        </Section>
      </Page>
    </ScrollView>
  );
}

PickerScreen.navigationOptions = {
  title: 'Picker',
};
