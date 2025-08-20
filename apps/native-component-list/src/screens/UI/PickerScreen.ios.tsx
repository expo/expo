import { Host, Picker, Section as NativeSection } from '@expo/ui/swift-ui';
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
          <Host matchContents>
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
        <Section title="Menu picker">
          <Host style={{ height: 100 }}>
            <NativeSection>
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
          </Host>
        </Section>
        <Section title="Inline picker">
          <Host style={{ height: 300 }}>
            <NativeSection>
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
          </Host>
        </Section>
        <Section title="Wheel picker">
          <Host style={{ width: 300, height: 200 }}>
            <Picker
              options={options}
              selectedIndex={selectedIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedIndex(index);
              }}
              variant="wheel"
            />
          </Host>
        </Section>
        <Section title="Tinted picker">
          <Host matchContents>
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
      </Page>
    </ScrollView>
  );
}

PickerScreen.navigationOptions = {
  title: 'Picker',
};
