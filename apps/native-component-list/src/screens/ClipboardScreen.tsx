import * as React from 'react';
import { Button, Clipboard, Text, TextInput } from 'react-native';

import { Page, Section } from '../components/Page';

export default function ClipboardScreen() {
  return (
    <Page>
      <Section title="Set String">
        <SetStringExample />
      </Section>
      <Section title="Get String">
        <GetStringExample />
      </Section>
    </Page>
  );
}

ClipboardScreen.navigationOptions = {
  title: 'StatusBar',
};

function GetStringExample() {
  const [value, setValue] = React.useState('');

  return (
    <>
      <Text>On the clipboard: {value || 'nothing'}</Text>

      <Button
        onPress={async () => {
          const value = await Clipboard.getString();
          console.log('got clipboard:', value);
          setValue(value);
        }}
        title="Get Clipboard"
      />
    </>
  );
}

function SetStringExample() {
  const [value, setValue] = React.useState('Some random string');

  return (
    <>
      <Button
        onPress={() => {
          console.log('copy to clipboard:', value);
          Clipboard.setString(value);
        }}
        title="Copy to clipboard"
      />
      <TextInput
        multiline={true}
        onChangeText={setValue}
        value={value}
        style={{ padding: 8, height: 48, margin: 8, borderBottomWidth: 1 }}
      />
    </>
  );
}
