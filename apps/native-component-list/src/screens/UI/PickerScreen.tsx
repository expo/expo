import { Picker } from '@expo/ui/Picker';
import { Section as NativeSection } from '@expo/ui/Section';
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
          <Picker
            options={options}
            selectedIndex={selectedIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setSelectedIndex(index);
            }}
            variant="segmented"
          />
        </Section>
        <Section title="Menu picker">
          <NativeSection style={{ height: 100 }}>
            <Picker
              options={options}
              selectedIndex={selectedIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedIndex(index);
              }}
              label="Cost"
              variant="menu"
            />
          </NativeSection>
        </Section>
        <Section title="Inline picker">
          <NativeSection style={{ height: 300 }}>
            <Picker
              options={options}
              selectedIndex={selectedIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedIndex(index);
              }}
              label="Cost"
              variant="inline"
            />
          </NativeSection>
        </Section>
        <Section title="Wheel picker">
          <Picker
            options={options}
            selectedIndex={selectedIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setSelectedIndex(index);
            }}
            variant="wheel"
            style={{
              width: 300,
              height: 200,
            }}
          />
        </Section>
        <Section title="Tinted picker">
          <Picker
            options={options}
            selectedIndex={selectedIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setSelectedIndex(index);
            }}
            color="#ff5500"
          />
        </Section>
        <Section title="Radio picker">
          <Picker
            options={options}
            selectedIndex={selectedIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setSelectedIndex(index);
            }}
            variant="radio"
          />
        </Section>
      </Page>
    </ScrollView>
  );
}

PickerScreen.navigationOptions = {
  title: 'Picker',
};
