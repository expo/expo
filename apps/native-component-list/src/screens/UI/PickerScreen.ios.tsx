import { Host, List, Picker, Section, Text } from '@expo/ui/swift-ui';
import * as React from 'react';

import { font, PickerStyle, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';

const pickerTypes: PickerStyle[] = [
  'segmented',
  'menu',
  'inline',
  'wheel',
  'palette',
  'navigationLink',
];
export default function PickerScreen() {
  const [selectedTag, setSelectedTag] = React.useState<string>('$');
  const options = ['$', '$$', '$$$', '$$$$'];
  const [pickerType, setPickerType] = React.useState<PickerStyle>('segmented');

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Selected value">
          <Text>{selectedTag}</Text>
        </Section>
        <Section title="Picker type">
          <Picker
            selection={pickerType}
            onSelectionChange={({ nativeEvent: { selection } }) => {
              setPickerType(selection as (typeof pickerTypes)[number]);
            }}>
            <Picker.Content>
              {pickerTypes.map((type) => (
                <Text key={type} modifiers={[tag(type)]}>
                  {type}
                </Text>
              ))}
            </Picker.Content>
          </Picker>
        </Section>
        <Section title={`${pickerType} picker`}>
          <Picker
            modifiers={[pickerStyle(pickerType)]}
            selection={selectedTag}
            onSelectionChange={({ nativeEvent: { selection } }) => {
              setSelectedTag(selection);
            }}>
            <Picker.Content>
              {options.map((option) => (
                <Text key={option} modifiers={[tag(option)]}>
                  {option}
                </Text>
              ))}
            </Picker.Content>
          </Picker>
        </Section>
      </List>
    </Host>
  );
}

PickerScreen.navigationOptions = {
  title: 'Picker',
};
