import { TextInput, TextInputRef, Button, Host } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { Text } from 'react-native';

import { ScrollPage, Section } from '../../components/Page';

export default function TextInputScreen() {
  const [value, setValue] = React.useState<string>('');
  const textRef = React.useRef<TextInputRef>(null);
  return (
    <ScrollPage>
      <Section title="Current value">
        <Text>{JSON.stringify(value)}</Text>
      </Section>
      <Button
        onPress={async () => {
          textRef.current?.setText('Hello there!');
        }}>
        Set text
      </Button>
      <Section title="Filled Text Input (Default)">
        <Host>
          <TextInput
            ref={textRef}
            autocorrection={false}
            defaultValue="hey there"
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Outlined Text Input">
        <Host>
          <TextInput
            variant="outlined"
            autocorrection={false}
            defaultValue="hey there"
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Filled with Label">
        <Host>
          <TextInput
            label="Username"
            autocorrection={false}
            defaultValue=""
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Outlined with Label">
        <Host>
          <TextInput
            variant="outlined"
            label="Email Address"
            autocorrection={false}
            defaultValue=""
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Filled with Label and Placeholder">
        <Host>
          <TextInput
            label="Email Address"
            placeholder="username@example.com"
            keyboardType="email-address"
            autocorrection={false}
            defaultValue=""
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Outlined with Label and Placeholder">
        <Host>
          <TextInput
            variant="outlined"
            label="Phone Number"
            placeholder="+1 (123) 456-7890"
            keyboardType="phone-pad"
            autocorrection={false}
            defaultValue=""
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Multiline Text Input">
        <Host>
          <TextInput
            multiline
            numberOfLines={5}
            autocorrection={false}
            defaultValue="hey there"
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Phone Text Input">
        <Host>
          <TextInput
            multiline
            numberOfLines={5}
            keyboardType="phone-pad"
            autocorrection={false}
            defaultValue="324342324"
            onChangeText={setValue}
          />
        </Host>
      </Section>

      <Section title="Capitalization">
        <Host>
          <TextInput
            multiline
            numberOfLines={5}
            autocorrection={false}
            defaultValue="CHARACTERS"
            onChangeText={setValue}
            autoCapitalize="characters"
          />

          <TextInput
            multiline
            numberOfLines={5}
            autocorrection={false}
            defaultValue="Capitalizing Words"
            onChangeText={setValue}
            autoCapitalize="words"
          />

          <TextInput
            multiline
            numberOfLines={5}
            autocorrection={false}
            defaultValue="Capitalizing sentences. This is a test."
            onChangeText={setValue}
            autoCapitalize="sentences"
          />
        </Host>
      </Section>
    </ScrollPage>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
