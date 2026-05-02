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
import { Platform } from 'react-native';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';

const italic = Platform.OS === 'ios' ? require('@expo/ui/swift-ui/modifiers').italic : null;
const composeShadow =
  Platform.OS === 'android' ? require('@expo/ui/jetpack-compose/modifiers').shadow : null;

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
  const [autoComplete, setAutoComplete] = useState<(typeof AUTO_COMPLETES)[number]>(undefined);
  const [contentSize, setContentSize] = useState<{ width: number; height: number } | null>(null);
  const [maxLengthOn, setMaxLengthOn] = useState(false);
  const [caretHidden, setCaretHidden] = useState(false);
  const [yellowSelection, setYellowSelection] = useState(false);
  const selection = useNativeState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [selectionDisplay, setSelectionDisplay] = useState({ start: 0, end: 0 });
  const [selectTextOnFocus, setSelectTextOnFocus] = useState(false);
  const [escapeHatchOn, setEscapeHatchOn] = useState(false);

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
              onContentSizeChange={setContentSize}
              maxLength={maxLengthOn ? 10 : undefined}
              caretHidden={caretHidden}
              selectionColor={yellowSelection ? 'yellow' : undefined}
              selection={selection}
              onSelectionChange={setSelectionDisplay}
              selectTextOnFocus={selectTextOnFocus}
              modifiers={
                escapeHatchOn
                  ? Platform.OS === 'ios' && italic
                    ? [italic()]
                    : Platform.OS === 'android' && composeShadow
                      ? [composeShadow(8)]
                      : undefined
                  : undefined
              }
            />
            <Text>{`Focused: ${focused}`}</Text>
            <Text>{`Last submitted: ${lastSubmitted ?? 'none'}`}</Text>
            <Text>
              {contentSize
                ? `Content size: ${contentSize.width.toFixed(1)} × ${contentSize.height.toFixed(1)}`
                : 'Content size: pending'}
            </Text>
            <Text>{`Selection: ${selectionDisplay.start}–${selectionDisplay.end}`}</Text>
            <Button
              label="Select 0–7"
              variant="outlined"
              onPress={() => {
                inputRef.current?.focus();
                inputRef.current?.setSelection(0, 7);
              }}
            />
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
            <Switch value={maxLengthOn} onValueChange={setMaxLengthOn} label="maxLength (10)" />
            <Switch value={caretHidden} onValueChange={setCaretHidden} label="caretHidden" />
            <Switch
              value={yellowSelection}
              onValueChange={setYellowSelection}
              label="selectionColor (yellow)"
            />
            <Switch
              value={selectTextOnFocus}
              onValueChange={setSelectTextOnFocus}
              label="selectTextOnFocus"
            />
            <Switch
              value={escapeHatchOn}
              onValueChange={setEscapeHatchOn}
              label={
                Platform.OS === 'ios'
                  ? 'modifiers (italic — iOS escape hatch)'
                  : 'modifiers (shadow — Android escape hatch)'
              }
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
