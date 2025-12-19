import { ColorPicker, Form, Host, Section, Switch, Text, VStack } from '@expo/ui/swift-ui';
import * as React from 'react';

export default function ColorPickerScreen() {
  const [color, setColor] = React.useState<string | null>('blue');
  const [supportsOpacity, setSupportsOpacity] = React.useState<boolean>(false);
  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Color Picker">
          <Text>Color: {color}</Text>
          <Host matchContents>
            <VStack spacing={8}>
              <Switch
                label="Supports opacity"
                value={supportsOpacity}
                onValueChange={setSupportsOpacity}
              />
              <ColorPicker
                label="Select a color"
                selection={color}
                supportsOpacity={supportsOpacity}
                onSelectionChange={setColor}
              />
            </VStack>
          </Host>
        </Section>
      </Form>
    </Host>
  );
}

ColorPickerScreen.navigationOptions = {
  title: 'Color Picker',
};
