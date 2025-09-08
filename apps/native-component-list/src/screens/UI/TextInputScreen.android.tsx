import { TextInput, TextInputRef, Button } from '@expo/ui/jetpack-compose';
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
      <Section title="Text Input">
        <TextInput
          ref={textRef}
          autocorrection={false}
          defaultValue="hey there"
          onChangeText={setValue}
        />
      </Section>
      <Section title="Multiline Text Input">
        <TextInput
          multiline
          numberOfLines={5}
          autocorrection={false}
          defaultValue="hey there"
          onChangeText={setValue}
        />
      </Section>
      <Section title="Phone Text Input">
        <TextInput
          multiline
          numberOfLines={5}
          keyboardType="phone-pad"
          autocorrection={false}
          defaultValue="324342324"
          onChangeText={setValue}
        />
      </Section>

      <Section title="Capitalization">
        <TextInput defaultValue="CHARACTERS" onChangeText={setValue} autoCapitalize="characters" />

        <TextInput
          defaultValue="Capitalizing Words"
          onChangeText={setValue}
          autoCapitalize="words"
        />

        <TextInput
          defaultValue="Capitalizing sentences. This is a test."
          onChangeText={setValue}
          autoCapitalize="sentences"
        />
      </Section>

      <Section title="Icons">
        <TextInput
          onChangeText={setValue}
          defaultValue="Leading Icon"
          leadingIcon="twotone.Search"
        />

        <TextInput
          onChangeText={setValue}
          defaultValue="Trailing Icon"
          trailingIcon="twotone.Check"
        />

        <TextInput
          onChangeText={setValue}
          defaultValue="Both Icons"
          leadingIcon="twotone.Star"
          trailingIcon="twotone.Favorite"
        />
      </Section>
    </ScrollPage>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
