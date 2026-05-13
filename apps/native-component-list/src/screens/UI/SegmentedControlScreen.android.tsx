import {
  SingleChoiceSegmentedButtonRow,
  MultiChoiceSegmentedButtonRow,
  SegmentedButton,
  Text,
  Host,
} from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { ScrollView, Text as RNText } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function SegmentedControlScreen() {
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
  const options = ['$', '$$', '$$$', '$$$$'];

  const [checkedItems, setCheckedItems] = React.useState<boolean[]>([false, false, false, false]);
  const multiOptions = ['Wi-Fi', 'Bluetooth', 'NFC', 'GPS'];

  return (
    <ScrollView>
      <Page>
        <Section title="Selected value">
          <RNText>{options[selectedIndex]}</RNText>
        </Section>
        <Section title="SingleChoiceSegmentedButtonRow">
          <Host matchContents={{ vertical: true }}>
            <SingleChoiceSegmentedButtonRow>
              {options.map((label, index) => (
                <SegmentedButton
                  key={label}
                  selected={index === selectedIndex}
                  onClick={() => setSelectedIndex(index)}>
                  <SegmentedButton.Label>
                    <Text>{label}</Text>
                  </SegmentedButton.Label>
                </SegmentedButton>
              ))}
            </SingleChoiceSegmentedButtonRow>
          </Host>
        </Section>
        <Section title="Tinted SingleChoiceSegmentedButtonRow">
          <Host matchContents={{ vertical: true }}>
            <SingleChoiceSegmentedButtonRow>
              {options.map((label, index) => (
                <SegmentedButton
                  key={label}
                  selected={index === selectedIndex}
                  onClick={() => setSelectedIndex(index)}
                  colors={{ activeContainerColor: '#ff5500' }}>
                  <SegmentedButton.Label>
                    <Text>{label}</Text>
                  </SegmentedButton.Label>
                </SegmentedButton>
              ))}
            </SingleChoiceSegmentedButtonRow>
          </Host>
        </Section>
        <Section title="Checked items">
          <RNText>{multiOptions.filter((_, i) => checkedItems[i]).join(', ') || 'None'}</RNText>
        </Section>
        <Section title="MultiChoiceSegmentedButtonRow">
          <Host matchContents={{ vertical: true }}>
            <MultiChoiceSegmentedButtonRow>
              {multiOptions.map((label, index) => (
                <SegmentedButton
                  key={label}
                  checked={checkedItems[index]}
                  onCheckedChange={(checked) => {
                    setCheckedItems((prev) => {
                      const next = [...prev];
                      next[index] = checked;
                      return next;
                    });
                  }}>
                  <SegmentedButton.Label>
                    <Text>{label}</Text>
                  </SegmentedButton.Label>
                </SegmentedButton>
              ))}
            </MultiChoiceSegmentedButtonRow>
          </Host>
        </Section>
      </Page>
    </ScrollView>
  );
}

SegmentedControlScreen.navigationOptions = {
  title: 'Segmented Control',
};
