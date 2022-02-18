import * as Clipboard from 'expo-clipboard';
import * as React from 'react';
import { Button, Text, TextInput } from 'react-native';

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
      <Section title="Clipboard listener">
        <ListenerExample />
      </Section>
    </Page>
  );
}

ClipboardScreen.navigationOptions = {
  title: 'Clipboard',
};

function GetStringExample() {
  const [value, setValue] = React.useState('');

  return (
    <>
      <Text>On the clipboard: {value || 'nothing'}</Text>

      <Button
        onPress={async () => {
          const value = await Clipboard.getStringAsync();
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
          Clipboard.setStringAsync(value);
        }}
        title="Copy to clipboard"
      />
      <TextInput
        multiline
        onChangeText={setValue}
        value={value}
        style={{ padding: 8, height: 48, margin: 8, borderBottomWidth: 1 }}
      />
    </>
  );
}

function ListenerExample() {
  const clipboardListener = React.useRef<Clipboard.Subscription | null>(null);
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    clipboardListener.current = Clipboard.addClipboardListener(
      ({ content }: { content: string }) => {
        setValue(content);
      }
    );

    return () => {
      if (clipboardListener.current) {
        Clipboard.removeClipboardListener(clipboardListener.current);
      }
    };
  }, []);

  return (
    <>
      <Text style={{ padding: 8, height: 48, margin: 8, borderBottomWidth: 1 }}>
        Clipboard value changed to: {value}
      </Text>
    </>
  );
}
