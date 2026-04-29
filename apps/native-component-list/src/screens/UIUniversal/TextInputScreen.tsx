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
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';

const KEYBOARD_TYPES: KeyboardTypeOptions[] = [
  'default',
  'email-address',
  'numeric',
  'number-pad',
  'decimal-pad',
  'phone-pad',
  'url',
];

type AutoCapitalize = 'none' | 'sentences' | 'words' | 'characters';
const AUTO_CAPITALIZE: AutoCapitalize[] = ['none', 'sentences', 'words', 'characters'];

const RETURN_KEY_TYPES: ReturnKeyTypeOptions[] = ['done', 'go', 'next', 'search', 'send'];

export default function TextInputScreen() {
  const text = useNativeState('');
  const [editable, setEditable] = useState(true);
  const [multiline, setMultiline] = useState(false);
  const [keyboardType, setKeyboardType] = useState<KeyboardTypeOptions>('default');
  const [autoCapitalize, setAutoCapitalize] = useState<AutoCapitalize>('sentences');
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [returnKeyType, setReturnKeyType] = useState<ReturnKeyTypeOptions>('done');
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const cycleKeyboardType = () => {
    const i = KEYBOARD_TYPES.indexOf(keyboardType);
    setKeyboardType(KEYBOARD_TYPES[(i + 1) % KEYBOARD_TYPES.length]);
  };

  const cycleAutoCapitalize = () => {
    const i = AUTO_CAPITALIZE.indexOf(autoCapitalize);
    setAutoCapitalize(AUTO_CAPITALIZE[(i + 1) % AUTO_CAPITALIZE.length]);
  };

  const cycleReturnKeyType = () => {
    const i = RETURN_KEY_TYPES.indexOf(returnKeyType);
    setReturnKeyType(RETURN_KEY_TYPES[(i + 1) % RETURN_KEY_TYPES.length]);
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
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              returnKeyType={returnKeyType}
              onSubmitEditing={setLastSubmitted}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <Text>{`Focused: ${focused}`}</Text>
            <Text>{`Last submitted: ${lastSubmitted ?? 'none'}`}</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Props</Text>
            <Switch value={editable} onValueChange={setEditable} label="editable" />
            <Switch value={multiline} onValueChange={setMultiline} label="multiline" />
            <Switch value={autoCorrect} onValueChange={setAutoCorrect} label="autoCorrect" />
            <Button
              label={`keyboardType: ${keyboardType}`}
              variant="outlined"
              onPress={cycleKeyboardType}
            />
            <Button
              label={`autoCapitalize: ${autoCapitalize}`}
              variant="outlined"
              onPress={cycleAutoCapitalize}
            />
            <Button
              label={`returnKeyType: ${returnKeyType}`}
              variant="outlined"
              onPress={cycleReturnKeyType}
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
