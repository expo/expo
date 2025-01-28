import { Picker, Section } from '@expo/ui';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';

export default function SectionScreen() {
  return (
    <ScrollView>
      <Section title="My form Section">
        <Text style={{ fontSize: 17 }}>We're no strangers to love</Text>
        <Picker
          options={['And so do I', "A full commitment's"]}
          variant="menu"
          selectedIndex={0}
          onOptionSelected={console.log}
          style={{ flex: 1 }}
          label="You know the rules"
        />
      </Section>
    </ScrollView>
  );
}

SectionScreen.navigationOptions = {
  title: 'Section',
};
