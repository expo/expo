import { Button } from '@expo/ui/components/Button';
import { ColorPicker } from '@expo/ui/components/ColorPicker';
import { Picker } from '@expo/ui/components/Picker';
import { Section } from '@expo/ui/components/Section';
import { Slider } from '@expo/ui/components/Slider';
import { Switch } from '@expo/ui/components/Switch';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';
export default function SectionScreen() {
  const [color, setColor] = React.useState<string | null>('blue');
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const options = ['$', '$$', '$$$', '$$$$'];
  const [sliderValue, setSliderValue] = React.useState<number>(0.5);
  const [switchValue, setSwitchValue] = React.useState<boolean>(true);

  return (
    <ScrollView>
      <Section title="My form Section">
        <Text style={{ fontSize: 17 }}>Some text!</Text>
        <Button onPress={() => alert('Clicked!')}>I'm a button</Button>
        <Switch
          value={switchValue}
          label="This is a switch"
          onValueChange={setSwitchValue}
          style={{
            width: 300,
            height: 100,
          }}
        />
        <ColorPicker
          label="Select a color"
          selection={color}
          supportsOpacity
          onValueChanged={setColor}
          style={{
            width: 300,
            height: 100,
          }}
        />
        <Picker
          label="Menu picker"
          options={options}
          selectedIndex={selectedIndex}
          onOptionSelected={({ nativeEvent: { index } }) => {
            setSelectedIndex(index);
          }}
          variant="menu"
          style={{
            width: 300,
            height: 100,
          }}
        />
        <Slider
          value={sliderValue}
          onValueChange={setSliderValue}
          style={{
            width: 300,
            height: 100,
          }}
        />
      </Section>
    </ScrollView>
  );
}

SectionScreen.navigationOptions = {
  title: 'Section',
};
