import { Host, TextField, Form, Section, Text, useTextFieldWorkletRef } from '@expo/ui/swift-ui';
import type { TextFieldRef } from '@expo/ui/swift-ui';
import { listSectionSpacing, scrollDismissesKeyboard } from '@expo/ui/swift-ui/modifiers';
import { installOnUIRuntime } from 'expo';
import * as React from 'react';

installOnUIRuntime();

export default function SyncTextInputScreen() {
  const creditCardRef = React.useRef<TextFieldRef>(null);
  const creditCardWorkletRef = useTextFieldWorkletRef(creditCardRef);

  const phoneRef = React.useRef<TextFieldRef>(null);
  const phoneWorkletRef = useTextFieldWorkletRef(phoneRef);

  const uppercaseRef = React.useRef<TextFieldRef>(null);
  const uppercaseWorkletRef = useTextFieldWorkletRef(uppercaseRef);

  const creditCard = React.useCallback(
    (value: string) => {
      'worklet';
      const digits = value.replace(/[^0-9]/g, '').slice(0, 16);
      const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
      console.log('edde');
      creditCardWorkletRef?.setText(formatted);
    },
    [creditCardWorkletRef]
  );

  const phoneNumber = React.useCallback(
    (value: string) => {
      'worklet';
      const digits = value.replace(/[^0-9]/g, '').slice(0, 10);
      let formatted = digits;
      if (digits.length <= 3) {
        formatted = digits;
      } else if (digits.length <= 6) {
        formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else {
        formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      phoneWorkletRef?.setText(formatted);
    },
    [phoneWorkletRef]
  );

  const uppercased = React.useCallback(
    (value: string) => {
      'worklet';
      uppercaseWorkletRef?.setText(value.toUpperCase());
    },
    [uppercaseWorkletRef]
  );

  return (
    <Host style={{ flex: 1 }}>
      <Form modifiers={[listSectionSpacing('compact'), scrollDismissesKeyboard('interactively')]}>
        <Section title="Credit Card" footer={<Text>Formats as 4242 4242 4242 4242</Text>}>
          <TextField ref={creditCardRef} placeholder="Card number" onChangeSync={creditCard} />
        </Section>
        <Section title="Phone Number" footer={<Text>Formats as (555) 123-4567</Text>}>
          <TextField ref={phoneRef} placeholder="Phone number" onChangeSync={phoneNumber} />
        </Section>
        <Section title="Uppercase" footer={<Text>Transforms text to uppercase synchronously</Text>}>
          <TextField ref={uppercaseRef} placeholder="Type here..." onChangeSync={uppercased} />
        </Section>
      </Form>
    </Host>
  );
}

SyncTextInputScreen.navigationOptions = {
  title: 'Sync TextInput (Worklets)',
};
