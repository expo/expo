import { Host, List, Picker, Section, Text } from '@expo/ui/swift-ui';
import {
  font,
  PickerStyleType,
  pickerStyle,
  tag,
  animation,
  Animation,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

const pickerTypes: PickerStyleType[] = ['segmented', 'menu', 'inline', 'wheel', 'palette'];
export default function PickerScreen() {
  const [selectedTag, setSelectedTag] = React.useState<string | number>('$');
  const options = ['$', '$$', '$$$', '$$$$'];
  const [pickerType, setPickerType] = React.useState<PickerStyleType>('menu');
  const [animationState, setAnimationState] = React.useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <List modifiers={[animation(Animation.default, animationState)]}>
        <Section title="Selected value">
          <Text>{selectedTag}</Text>
        </Section>
        <Section title="Picker type">
          <Picker
            selection={pickerType}
            onSelectionChange={(selection) => {
              setAnimationState(!animationState);
              setPickerType(selection);
            }}>
            {pickerTypes.map((type) => (
              <Text key={type} modifiers={[tag(type)]}>
                {type}
              </Text>
            ))}
          </Picker>
        </Section>
        <Section title={`${pickerType} picker`}>
          <Picker
            modifiers={[pickerStyle(pickerType)]}
            selection={selectedTag}
            onSelectionChange={setSelectedTag}>
            {options.map((option) => (
              <Text key={option} modifiers={[tag(option)]}>
                {option}
              </Text>
            ))}
          </Picker>
        </Section>
        <Section title={`${pickerType} picker with label`}>
          <Picker
            modifiers={[pickerStyle(pickerType)]}
            label="Select a tag"
            selection={selectedTag}
            onSelectionChange={setSelectedTag}>
            {options.map((option) => (
              <Text key={option} modifiers={[tag(option)]}>
                {option}
              </Text>
            ))}
          </Picker>
        </Section>
        <Section title={`${pickerType} picker with custom label`}>
          <Picker
            modifiers={[pickerStyle(pickerType)]}
            label={<Text modifiers={[font({ size: 16, weight: 'bold' })]}>Select a tag</Text>}
            selection={selectedTag}
            onSelectionChange={(selection) => {
              console.log('selection', selection);
              setSelectedTag(selection);
            }}>
            {options.map((option) => (
              <Text key={option} modifiers={[tag(option)]}>
                {option}
              </Text>
            ))}
          </Picker>
        </Section>
      </List>
    </Host>
  );
}

PickerScreen.navigationOptions = {
  title: 'Picker',
};
