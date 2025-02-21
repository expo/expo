import { TextInput } from '@expo/ui/components/TextInput';
import * as React from 'react';
import { Text } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function TextInputScreen() {
  const [value, setValue] = React.useState<string>('');
  return (
    <Page>
      <Section title="Current value">
        <Text>{JSON.stringify(value)}</Text>
      </Section>
      <Section title="Text Input">
        <TextInput autocorrection={false} initialValue="hey there" onChangeText={setValue} />
      </Section>
      <Section title="Multiline Text Input">
        <TextInput
          multiline
          numberOfLines={5}
          autocorrection={false}
          initialValue="hey there"
          onChangeText={setValue}
        />
      </Section>
      <Section title="Phone Text Input">
        <TextInput
          multiline
          numberOfLines={5}
          keyboardType="phone-pad"
          autocorrection={false}
          initialValue="324342324"
          onChangeText={setValue}
        />
      </Section>
    </Page>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
