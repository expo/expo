import {
  Button,
  Host,
  TextField,
  TextFieldRef,
  SecureField,
  TextFieldProps,
} from '@expo/ui/swift-ui';
import * as React from 'react';
import { Text, TextInput as RNTextInput, View, TextInput } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function TextInputScreen() {
  const [value, setValue] = React.useState<string>('');

  const onChangeText = async (value: string) => {
    if (value === '1') {
      setValue('one');
    } else if (value === '2') {
      setValue(value);
    } else if (value === '3') {
      console.log('will set in a sec');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setValue('three');
    }

    if (value === '4') {
      setValue('four');
    }

    if (value === '5') {
      setValue('hello world');
    }

    if (value === '') {
      setValue('');
    }
  };

  console.log('value', value);
  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
      <Text>Expo UITextInput</Text>
      <Host matchContents>
        <ControlledTextField value={value} onChangeText={onChangeText} placeholder="Type here" />
      </Host>
      <Text>React Native TextInput</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Type here"
        style={{ height: 40 }}
      />
    </View>
  );
}

const ControlledTextField = (props: TextFieldProps) => {
  const textFieldRef = React.useRef<TextFieldRef>(null);

  const onChangeText = async (value: string) => {
    await props.onChangeText(value);

    setTimeout(() => {
      // this rests the lock if setValue was not called
      textFieldRef.current?.resetControlledState();
    });
  };

  return <TextField {...props} onChangeText={onChangeText} ref={textFieldRef} />;
};

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
