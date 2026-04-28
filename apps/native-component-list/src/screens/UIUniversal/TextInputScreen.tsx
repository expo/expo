import {
  Button,
  Column,
  Host,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useNativeState,
} from '@expo/ui';
import { useState } from 'react';
import type { KeyboardTypeOptions } from 'react-native';

const KEYBOARD_TYPES: KeyboardTypeOptions[] = [
  'default',
  'email-address',
  'numeric',
  'number-pad',
  'decimal-pad',
  'phone-pad',
  'url',
];

export default function TextInputScreen() {
  const text = useNativeState('');
  const [editable, setEditable] = useState(true);
  const [multiline, setMultiline] = useState(false);
  const [keyboardType, setKeyboardType] = useState<KeyboardTypeOptions>('default');

  const cycleKeyboardType = () => {
    const i = KEYBOARD_TYPES.indexOf(keyboardType);
    setKeyboardType(KEYBOARD_TYPES[(i + 1) % KEYBOARD_TYPES.length]);
  };

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>TextInput</Text>
            <TextInput
              value={text}
              placeholder="Type here..."
              editable={editable}
              multiline={multiline}
              keyboardType={keyboardType}
            />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Props</Text>
            <Switch value={editable} onValueChange={setEditable} label="editable" />
            <Switch value={multiline} onValueChange={setMultiline} label="multiline" />
            <Button
              label={`keyboardType: ${keyboardType}`}
              variant="outlined"
              onPress={cycleKeyboardType}
            />
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
