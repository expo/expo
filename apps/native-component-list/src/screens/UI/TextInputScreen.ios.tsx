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
} from '@expo/ui/swift-ui';
import { listSectionSpacing, scrollDismissesKeyboard } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

export default function TextInputScreen() {
  const textRef = React.useRef<TextFieldRef>(null);
  const secureRef = React.useRef<TextFieldRef>(null);
  const [selection, setSelection] = React.useState<{ start: number; end: number } | null>(null);

  return (
    <Host style={{ flex: 1 }}>
      <Form modifiers={[listSectionSpacing('compact'), scrollDismissesKeyboard('interactively')]}>
        <Section title="Text Input">
          <TextField
            ref={textRef}
            autocorrection={false}
            defaultValue="hey there"
            onChangeText={(value) => {
              console.log('value', value);
            }}
            onChangeSelection={setSelection}
            onSubmit={(value) => {
              alert('onSubmit: ' + value);
            }}
          />
          <HStack spacing={16}>
            <Button
              variant="bordered"
              onPress={async () => {
                textRef.current?.focus();
              }}>
              Focus
            </Button>
            <Button
              variant="bordered"
              onPress={async () => {
                textRef.current?.blur();
                secureRef.current?.blur();
              }}>
              Blur
            </Button>
          </HStack>
          <HStack spacing={16}>
            <Button
              variant="bordered"
              onPress={async () => {
                textRef.current?.setText('Hello there!');
                secureRef.current?.setText('123');
              }}>
              Set text
            </Button>
            <Button
              variant="bordered"
              onPress={async () => {
                textRef.current?.setSelection(2, 7);
              }}>
              Set Selection
            </Button>
          </HStack>
          <Text>Selection: {JSON.stringify(selection)}</Text>
        </Section>
        <Section title="Multiline Text Input">
          <TextField
            multiline
            numberOfLines={5}
            autocorrection={false}
            allowNewlines={false}
            defaultValue="This input wraps text in new lines when text reaches width of the input"
            onChangeText={(value) => {
              console.log('value', value);
            }}
          />
        </Section>
        <Section title="Phone Text Input">
          <TextField
            multiline
            numberOfLines={5}
            keyboardType="phone-pad"
            autocorrection={false}
            defaultValue="324342324"
            onChangeText={(value) => {
              console.log('value', value);
            }}
          />
        </Section>
        <Section title="Multiline, allowNewlines Text Input">
          <TextField
            multiline
            numberOfLines={5}
            allowNewlines
            autocorrection={false}
            defaultValue="hey there"
          />
        </Section>
        <Section title="Secure Text Input">
          <SecureField ref={secureRef} defaultValue="hey there" keyboardType="numeric" />
        </Section>
      </Form>
    </Host>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
