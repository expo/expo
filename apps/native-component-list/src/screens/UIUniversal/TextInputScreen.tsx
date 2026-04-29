import {
  Button,
  Column,
  Host,
  ScrollView,
  Switch,
  Text,
  TextInput,
  type TextInputRef,
  useNativeState,
} from '@expo/ui';
import { useRef, useState } from 'react';
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

type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';
const TEXT_ALIGNS: TextAlign[] = ['auto', 'left', 'center', 'right', 'justify'];

const NUMBER_OF_LINES: (number | undefined)[] = [undefined, 3, 5];

const AUTO_COMPLETES = [
  undefined,
  'email',
  'username',
  'password',
  'one-time-code',
  'tel',
  'name',
] as const;

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
  const [redCursor, setRedCursor] = useState(false);
  const [bluePlaceholder, setBluePlaceholder] = useState(false);
  const [customStyle, setCustomStyle] = useState(false);
  const [customTextStyle, setCustomTextStyle] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(false);
  const [autoComplete, setAutoComplete] =
    useState<(typeof AUTO_COMPLETES)[number]>(undefined);

  const cycleAutoComplete = () => {
    const i = AUTO_COMPLETES.indexOf(autoComplete);
    setAutoComplete(AUTO_COMPLETES[(i + 1) % AUTO_COMPLETES.length]);
  };
  const [textAlign, setTextAlign] = useState<TextAlign>('auto');
  const [numberOfLines, setNumberOfLines] = useState<number | undefined>(undefined);
  const inputRef = useRef<TextInputRef>(null);

  const cycleNumberOfLines = () => {
    const i = NUMBER_OF_LINES.indexOf(numberOfLines);
    setNumberOfLines(NUMBER_OF_LINES[(i + 1) % NUMBER_OF_LINES.length]);
  };

  const cycleTextAlign = () => {
    const i = TEXT_ALIGNS.indexOf(textAlign);
    setTextAlign(TEXT_ALIGNS[(i + 1) % TEXT_ALIGNS.length]);
  };

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
              ref={inputRef}
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
              cursorColor={redCursor ? 'red' : undefined}
              placeholderTextColor={bluePlaceholder ? 'blue' : undefined}
              textAlign={textAlign}
              numberOfLines={numberOfLines}
              style={
                customStyle
                  ? {
                      width: 240,
                      padding: 12,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 8,
                      borderColor: 'black',
                      borderWidth: 1,
                    }
                  : undefined
              }
              textStyle={
                customTextStyle
                  ? { fontSize: 20, color: 'darkblue', fontWeight: '600', letterSpacing: 0.5 }
                  : undefined
              }
              secureTextEntry={secureTextEntry}
              autoComplete={autoComplete}
            />
            <Text>{`Focused: ${focused}`}</Text>
            <Text>{`Last submitted: ${lastSubmitted ?? 'none'}`}</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Props</Text>
            <Switch value={editable} onValueChange={setEditable} label="editable" />
            <Switch value={multiline} onValueChange={setMultiline} label="multiline" />
            <Switch value={autoCorrect} onValueChange={setAutoCorrect} label="autoCorrect" />
            <Switch value={redCursor} onValueChange={setRedCursor} label="cursorColor (red)" />
            <Switch
              value={bluePlaceholder}
              onValueChange={setBluePlaceholder}
              label="placeholderTextColor (blue)"
            />
            <Switch
              value={customStyle}
              onValueChange={setCustomStyle}
              label="style (240w, gray bg, rounded)"
            />
            <Switch
              value={customTextStyle}
              onValueChange={setCustomTextStyle}
              label="textStyle (20pt, darkblue, 600)"
            />
            <Switch
              value={secureTextEntry}
              onValueChange={setSecureTextEntry}
              label="secureTextEntry"
            />
            <Button
              label="ref.focus()"
              variant="outlined"
              onPress={() => inputRef.current?.focus()}
            />
            <Button
              label="ref.blur()"
              variant="outlined"
              onPress={() => inputRef.current?.blur()}
            />
            <Button
              label="ref.clear()"
              variant="outlined"
              onPress={() => inputRef.current?.clear()}
            />
            <Button
              label="ref.isFocused()"
              variant="outlined"
              onPress={() => alert(`isFocused: ${inputRef.current?.isFocused()}`)}
            />
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
            <Button label={`textAlign: ${textAlign}`} variant="outlined" onPress={cycleTextAlign} />
            <Button
              label={`numberOfLines: ${numberOfLines ?? 'auto'}`}
              variant="outlined"
              onPress={cycleNumberOfLines}
            />
            <Button
              label={`autoComplete: ${autoComplete ?? 'none'}`}
              variant="outlined"
              onPress={cycleAutoComplete}
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
