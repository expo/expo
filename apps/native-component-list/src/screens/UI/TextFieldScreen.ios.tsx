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

export default function TextFieldScreen() {
  const textRef = React.useRef<TextFieldRef>(null);
  // State
  const [username, setUsername] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [selection, setSelection] = React.useState<{ start: number; end: number } | null>(null);

  // Submit label picker
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
            defaultValue="johndoe"
            placeholder="Username"
            modifiers={[autocorrectionDisabled()]}
            onValueChange={setUsername}
          />
          <TextField
            placeholder="Email"
            modifiers={[keyboardType('email-address'), autocorrectionDisabled()]}
            onValueChange={setEmail}
          />
          <TextField
            axis="vertical"
            placeholder="Tell us about yourself..."
            modifiers={[lineLimit(3, { reservesSpace: true })]}
            onValueChange={setBio}
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
            onValueChange={setPhone}
          />
          <TextField
            placeholder="Website"
            modifiers={[keyboardType('url'), autocorrectionDisabled()]}
          />
          <TextField placeholder="Amount" modifiers={[keyboardType('decimal-pad')]} />
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
            defaultValue="Select me!"
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
