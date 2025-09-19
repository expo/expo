import { Button, Host, TextField, TextFieldRef, SecureField } from '@expo/ui/swift-ui';
import * as React from 'react';
import { Text, TextInput as RNTextInput } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function TextInputScreen() {
  const [value, setValue] = React.useState<string>('');

  const onChangeText = (value: string) => {
    if (value === 'Hello') {
      setValue('i changed synchronously');
    } else {
      setValue(value);
    }
  };

  console.log('value', value);
  return (
    <Page>
      <Section title="Current value">
        <Text>{JSON.stringify(value)}</Text>
      </Section>
      <Section title="Phone Number (Auto-formatted)">
        <Host matchContents>
          <TextField
            keyboardType="phone-pad"
            autocorrection={false}
            value={value}
            onChangeText={onChangeText}
            placeholder="Enter phone number"
          />
        </Host>
      </Section>
      {/* <Section title="Text Input">
        <Host matchContents>
          <TextField
            ref={textRef}
            autocorrection={false}
            defaultValue="hey there"
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Multiline Text Input">
        <Host matchContents>
          <TextField
            multiline
            numberOfLines={5}
            autocorrection={false}
            allowNewlines={false}
            defaultValue="hey there"
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Phone Text Input">
        <Host matchContents>
          <TextField
            multiline
            numberOfLines={5}
            keyboardType="phone-pad"
            autocorrection={false}
            defaultValue="324342324"
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Multiline, allowNewlines Text Input">
        <Host matchContents>
          <TextField
            multiline
            numberOfLines={5}
            allowNewlines
            autocorrection={false}
            defaultValue="hey there"
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Secure Text Input">
        <Host matchContents>
          <SecureField
            ref={secureRef}
            defaultValue="hey there"
            onChangeText={setValue}
            keyboardType="numeric"
          />
        </Host>
      </Section>
      <Section title="RN Text Input">
        <RNTextInput multiline numberOfLines={5} value={value} onChangeText={setValue} />
      </Section> */}
    </Page>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
