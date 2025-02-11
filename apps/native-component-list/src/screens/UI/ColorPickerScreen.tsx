import { ColorPicker } from '@expo/ui/components/ColorPicker';
import * as React from 'react';
import { Dimensions, ScrollView, Text } from 'react-native';

import { Page, Section } from '../../components/Page';
import { Switch } from '@expo/ui/components/Switch';

export default function ColorPickerScreen() {
  const [color, setColor] = React.useState<string | null>('blue');
  const [supportsOpacity, setSupportsOpacity] = React.useState<boolean>(false);
  return (
    <ScrollView>
      <Page>
        <Section title="Color Picker">
          <Text>Color: {color}</Text>
          <Switch
            label="Supports opacity"
            value={supportsOpacity}
            onValueChange={setSupportsOpacity}
          />
          <ColorPicker
            label="Select a colo!r"
            selection={color}
            supportsOpacity={supportsOpacity}
            onValueChanged={setColor}
            style={{
              width: Dimensions.get('window').width - 20,
              height: 100,
            }}
          />
        </Section>
      </Page>
    </ScrollView>
  );
}

ColorPickerScreen.navigationOptions = {
  title: 'Color Picker',
};
