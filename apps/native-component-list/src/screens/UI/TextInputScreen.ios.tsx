import { TextField, SecureField } from '@expo/ui/swift-ui';
import * as React from 'react';
import { Text, TextInput as RNTextInput } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function TextInputScreen() {
  const [value, setValue] = React.useState<string>('');
  return (
    <Page>
      <Section title="Current value">
        <Text>{JSON.stringify(value)}</Text>
      </Section>
      <Section title="Text Input">
        <TextField autocorrection={false} defaultValue="hey there" onChangeText={setValue} />
      </Section>
      <Section title="Multiline Text Input">
        <TextField
          multiline
          numberOfLines={5}
          autocorrection={false}
          allowNewlines={false}
          defaultValue="hey there"
          onChangeText={setValue}
        />
      </Section>
      <Section title="Phone Text Input">
        <TextField
          multiline
          numberOfLines={5}
          keyboardType="phone-pad"
          autocorrection={false}
          defaultValue="324342324"
          onChangeText={setValue}
        />
      </Section>
      <Section title="Multiline, allowNewlines Text Input">
        <TextField
          multiline
          numberOfLines={5}
          allowNewlines
          autocorrection={false}
          defaultValue="hey there"
          onChangeText={setValue}
        />
      </Section>
      <Section title="Secure Text Input">
        <SecureField defaultValue="hey there" onChangeText={setValue} keyboardType="numeric" />
      </Section>
      <Section title="RN Text Input">
        <RNTextInput multiline numberOfLines={5} value={value} onChangeText={setValue} />
      </Section>
    </Page>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
