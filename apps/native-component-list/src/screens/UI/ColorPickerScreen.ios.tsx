import { ColorPicker, Host, Switch, VStack } from '@expo/ui/swift-ui';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function ColorPickerScreen() {
  const [color, setColor] = React.useState<string | null>('blue');
  const [supportsOpacity, setSupportsOpacity] = React.useState<boolean>(false);
  return (
    <ScrollView>
      <Page>
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
                onValueChanged={setColor}
              />
            </VStack>
          </Host>
        </Section>
      </Page>
    </ScrollView>
  );
}

ColorPickerScreen.navigationOptions = {
  title: 'Color Picker',
};
