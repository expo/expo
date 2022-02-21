import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import { Button, Text, TextInput, Image, Alert } from 'react-native';

import { ScrollPage, Section } from '../components/Page';

export default function ClipboardScreen() {
  return (
    <ScrollPage>
      <Section title="Set String">
        <SetStringExample />
      </Section>
      <Section title="Get String">
        <GetStringExample />
      </Section>
      <Section title="Set Url">
        <SetUrlExample />
      </Section>
      <Section title="Get Url">
        <GetUrlExample />
      </Section>
      <Section title="Set Image">
        <SetImageExample />
      </Section>
      <Section title="Get Png Image">
        <GetPngImageExample />
      </Section>
      <Section title="Get Jpg Image">
        <GetJpgImageExample />
      </Section>
      <Section title="Clipboard listener">
        <ListenerExample />
      </Section>
    </ScrollPage>
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

function GetUrlExample() {
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <>
      <Text>On the clipboard: {value || 'nothing'}</Text>

      <Button
        onPress={async () => {
          const value = await Clipboard.getUrlAsync();
          setValue(value);
        }}
        title="Get Clipboard"
      />
    </>
  );
}

function SetUrlExample() {
  const [value, setValue] = React.useState('https://example.com/');

  return (
    <>
      <Button
        onPress={() => {
          Clipboard.setUrlAsync(value);
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

function SetImageExample() {
  const [value, setValue] = React.useState<null | string>(null);

  const showPicker = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
      });
      if (result.cancelled || !result.base64) {
        setValue(null);
      } else {
        await Clipboard.setImageAsync(result.base64);
        setValue(result.base64);
      }
    } else {
      Alert.alert('Permission required!', 'You must allow accessing images in order to proceed.');
    }
  };

  return (
    <>
      <Button
        onPress={() => {
          showPicker();
        }}
        title="Select image to copy"
      />
      {!!value && (
        <Image
          source={{ uri: 'data:image/jpeg;base64,' + value }}
          style={{ width: 100, height: 50 }}
          resizeMode="contain"
        />
      )}
    </>
  );
}

function GetPngImageExample() {
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <>
      <Text>On the clipboard:</Text>
      {!!value && (
        <Image source={{ uri: value }} style={{ width: 100, height: 50 }} resizeMode="contain" />
      )}

      <Button
        onPress={async () => {
          const value = await Clipboard.getImageAsync({ format: 'png' });
          setValue(value?.data ?? null);
        }}
        title="Get Clipboard"
      />
    </>
  );
}

function GetJpgImageExample() {
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <>
      <Text>On the clipboard:</Text>
      {!!value && (
        <Image source={{ uri: value }} style={{ width: 100, height: 50 }} resizeMode="contain" />
      )}

      <Button
        onPress={async () => {
          const value = await Clipboard.getImageAsync({ format: 'jpeg' });
          setValue(value?.data ?? null);
        }}
        title="Get Clipboard"
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
