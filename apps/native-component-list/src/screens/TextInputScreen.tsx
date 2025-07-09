import * as React from 'react';
import { TextInput } from 'react-native';

import { Page, Section } from '../components/Page';

export default function TextInputScreen() {
  const [singleLineValue, updateSingle] = React.useState('');
  const [secureTextValue, updateSecure] = React.useState('');

  const textInputStyle: React.ComponentProps<typeof TextInput>['style'] = {
    width: '80%',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 15,
    padding: 5,
    height: 40,
  };

  return (
    <Page>
      <Section title="Single">
        <TextInput
          placeholder="A single line text input"
          onChangeText={updateSingle}
          style={[{ marginBottom: 10 }, textInputStyle]}
          value={singleLineValue}
        />
      </Section>
      <Section title="Secure">
        <TextInput
          placeholder="A secure text field"
          onChangeText={updateSecure}
          secureTextEntry
          keyboardAppearance="dark"
          style={[{ marginBottom: 10 }, textInputStyle]}
          value={secureTextValue}
        />
      </Section>
    </Page>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
