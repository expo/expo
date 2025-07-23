import { ButtonPrimitive, ColorPicker, Picker, Section, Slider, Switch } from '@expo/ui/swift-ui';
import * as React from 'react';
import { Text } from 'react-native';
export default function SectionScreen() {
  const [color, setColor] = React.useState<string | null>('blue');
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const options = ['$', '$$', '$$$', '$$$$'];
  const [sliderValue, setSliderValue] = React.useState<number>(0.5);
  const [switchValue, setSwitchValue] = React.useState<boolean>(true);

  return (
    <Section title="My form Section" style={{ flex: 1 }}>
      <Text style={{ fontSize: 17 }}>Some text!</Text>
      <ButtonPrimitive onPress={() => alert('Clicked!')}>I'm a button</ButtonPrimitive>
      <Switch value={switchValue} label="This is a switch" onValueChange={setSwitchValue} />
      <ColorPicker
        label="Select a color"
        selection={color}
        supportsOpacity
        onValueChanged={setColor}
      />
      <Picker
        label="Menu picker"
        options={options}
        selectedIndex={selectedIndex}
        onOptionSelected={({ nativeEvent: { index } }) => {
          setSelectedIndex(index);
        }}
        variant="menu"
      />
      <Slider value={sliderValue} onValueChange={setSliderValue} />
    </Section>
  );
}

SectionScreen.navigationOptions = {
  title: 'Section',
};
