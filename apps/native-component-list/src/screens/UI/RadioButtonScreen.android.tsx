import { RadioButton, Column, Row, Text as ComposeText, Host } from '@expo/ui/jetpack-compose';
import {
  selectable,
  selectableGroup,
  fillMaxWidth,
  height,
  padding,
} from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function RadioButtonScreen() {
  const [selectedOption, setSelectedOption] = React.useState('Calls');
  const groupOptions = ['Calls', 'Missed', 'Friends'];

  return (
    <ScrollView>
      <Page>
        <Section title="Radio Group">
          <Text>Selected: {selectedOption}</Text>
          <Host matchContents={{ vertical: true }}>
            <Column modifiers={[selectableGroup()]}>
              {groupOptions.map((label) => (
                <Row
                  key={label}
                  verticalAlignment="center"
                  modifiers={[
                    fillMaxWidth(),
                    height(56),
                    selectable(
                      label === selectedOption,
                      () => setSelectedOption(label),
                      'radioButton'
                    ),
                    padding(16, 0, 16, 0),
                  ]}>
                  <RadioButton selected={label === selectedOption} />
                  <ComposeText modifiers={[padding(16, 0, 0, 0)]}>{label}</ComposeText>
                </Row>
              ))}
            </Column>
          </Host>
        </Section>
      </Page>
    </ScrollView>
  );
}

RadioButtonScreen.navigationOptions = {
  title: 'Radio Button',
};
