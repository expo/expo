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
      <Host matchContents>
        <Button
          onPress={async () => {
            textRef.current?.setText('Hello there!');
          }}>
          Set text
        </Button>
      </Host>
      <Section title="Text Input">
        <Host matchContents>
          <TextInput
            ref={textRef}
            autocorrection={false}
            defaultValue="hey there"
            onChangeText={setValue}
          />
        </Host>
      </Section>
      <Section title="Multiline Text Input">
        <Host matchContents>
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
        <Host matchContents>
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
        <Host matchContents>
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
