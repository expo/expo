import {
  Button,
  Host,
  TextField,
  TextFieldRef,
  SecureField,
  Form,
  Section,
  Text,
  HStack,
  Picker,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  keyboardType,
  lineLimit,
  listSectionSpacing,
  onSubmit,
  pickerStyle,
  scrollDismissesKeyboard,
  submitLabel,
  tag,
  buttonStyle,
  foregroundStyle,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { runOnJS } from 'react-native-worklets';

export default function TextFieldScreen() {
  const textRef = React.useRef<TextFieldRef>(null);
  const phoneRef = React.useRef<TextFieldRef>(null);
  const [selection, setSelection] = React.useState<{ start: number; end: number } | null>(null);

  const setPhoneCursor = React.useCallback((position: number) => {
    phoneRef.current?.setSelection(position, position);
  }, []);

  const username = useNativeState('johndoe');
  const imperativeText = useNativeState('Select me!');
  const maskedPhone = useNativeState('');

  const submitLabelOptions = [
    'continue',
    'done',
    'go',
    'join',
    'next',
    'return',
    'route',
    'search',
    'send',
  ] as const;
  const [selectedSubmitLabel, setSelectedSubmitLabel] =
    React.useState<(typeof submitLabelOptions)[number]>('done');

  return (
    <Host style={{ flex: 1 }}>
      <Form modifiers={[listSectionSpacing('compact'), scrollDismissesKeyboard('interactively')]}>
        {/* Profile Form */}
        <Section title="Profile">
          <TextField
            text={username}
            placeholder="Username"
            modifiers={[autocorrectionDisabled()]}
            onTextChange={(v) => console.log('username:', v)}
          />
          <TextField
            placeholder="Email"
            modifiers={[keyboardType('email-address'), autocorrectionDisabled()]}
            onTextChange={(v) => console.log('email:', v)}
          />
          <TextField
            axis="vertical"
            placeholder="Tell us about yourself..."
            modifiers={[lineLimit(3, { reservesSpace: true })]}
            onTextChange={(v) => console.log('bio:', v)}
          />
        </Section>

        {/* Secure Input */}
        <Section title="Security">
          <SecureField placeholder="Password" />
          <SecureField placeholder="Confirm Password" />
        </Section>

        {/* Keyboard Types */}
        <Section title="Keyboard Types">
          <TextField
            placeholder="Phone number"
            modifiers={[keyboardType('phone-pad')]}
            onTextChange={(v) => console.log('phone:', v)}
          />
          <TextField
            placeholder="Website"
            modifiers={[keyboardType('url'), autocorrectionDisabled()]}
          />
          <TextField placeholder="Amount" modifiers={[keyboardType('decimal-pad')]} />
        </Section>

        {/* Worklet-based phone masking — updates synchronously on the UI thread */}
        <Section title="Worklet Phone Masking">
          <TextField
            ref={phoneRef}
            text={maskedPhone}
            placeholder="(555) 123-4567"
            modifiers={[keyboardType('phone-pad')]}
            onTextChange={(v) => {
              'worklet';
              const digits = v.replace(/\D/g, '').slice(0, 10);
              let formatted: string;
              if (digits.length === 0) {
                formatted = '';
              } else if (digits.length <= 3) {
                formatted = digits;
              } else if (digits.length <= 6) {
                formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
              } else {
                formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
              }
              if (formatted !== v) {
                maskedPhone.value = formatted;
                // To keep selection at the end of the input while typing
                runOnJS(setPhoneCursor)(formatted.length);
              }
            }}
          />
          <Text modifiers={[foregroundStyle('secondary')]}>
            Formatted on the UI thread, no flicker between the typed value and the masked value.
          </Text>
        </Section>

        {/* Multiline Variants */}
        <Section title="Multiline">
          <TextField axis="vertical" placeholder="Grows up to 5 lines" modifiers={[lineLimit(5)]} />
          <TextField
            axis="vertical"
            placeholder="Fixed 3-line height"
            modifiers={[lineLimit(3, { reservesSpace: true })]}
          />
          <TextField
            axis="vertical"
            placeholder="2 to 6 lines"
            modifiers={[lineLimit({ min: 2, max: 6 })]}
          />
        </Section>

        {/* Submit Label */}
        <Section title="Submit Label">
          <Picker
            label="Keyboard action"
            modifiers={[pickerStyle('menu')]}
            onSelectionChange={(sel) => {
              console.log('picker selected:', sel);
              setSelectedSubmitLabel(sel as (typeof submitLabelOptions)[number]);
            }}>
            {submitLabelOptions.map((option) => (
              <Text key={option} modifiers={[tag(option)]}>
                {option}
              </Text>
            ))}
          </Picker>
          <TextField
            key={selectedSubmitLabel}
            placeholder="Try the return key"
            modifiers={[
              submitLabel(selectedSubmitLabel),
              onSubmit(() => alert(`Submit label: ${selectedSubmitLabel}`)),
            ]}
          />
        </Section>

        {/* Imperative API */}
        <Section title="Imperative API">
          <TextField
            ref={textRef}
            text={imperativeText}
            placeholder="Imperative field"
            modifiers={[autocorrectionDisabled()]}
            onSelectionChange={setSelection}
          />
          <Text modifiers={[foregroundStyle('secondary')]}>
            Selection: {selection ? `${selection.start}–${selection.end}` : 'none'}
          </Text>
          <HStack spacing={12}>
            <Button
              modifiers={[buttonStyle('bordered')]}
              onPress={() => textRef.current?.focus()}
              label="Focus"
            />
            <Button
              modifiers={[buttonStyle('bordered')]}
              onPress={() => textRef.current?.blur()}
              label="Blur"
            />
            <Button
              modifiers={[buttonStyle('bordered')]}
              onPress={() => textRef.current?.setText('SwiftUI rocks!')}
              label="Set Text"
            />
            <Button
              modifiers={[buttonStyle('bordered')]}
              onPress={() => textRef.current?.setSelection(0, 7)}
              label="Select"
            />
          </HStack>
        </Section>
      </Form>
    </Host>
  );
}

TextFieldScreen.navigationOptions = {
  title: 'TextField',
};
