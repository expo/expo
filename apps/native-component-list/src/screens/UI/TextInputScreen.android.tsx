import { TextInput } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { Text } from 'react-native';

import { ScrollPage, Section } from '../../components/Page';

export default function TextInputScreen() {
  const [value, setValue] = React.useState<string>('');
  return (
    <ScrollPage>
      <Section title="Current value">
        <Text>{JSON.stringify(value)}</Text>
      </Section>
      <Section title="Text Input">
        <TextInput autocorrection={false} defaultValue="hey there" onChangeText={setValue} />
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
        <TextInput
          multiline
          numberOfLines={5}
          autocorrection={false}
          defaultValue="CHARACTERS"
          onChangeText={setValue}
          capitalization="characters"
        />

        <TextInput
          multiline
          numberOfLines={5}
          autocorrection={false}
          defaultValue="Capitalizing Words"
          onChangeText={setValue}
          capitalization="words"
        />

        <TextInput
          multiline
          numberOfLines={5}
          autocorrection={false}
          defaultValue="Capitalizing sentences. This is a test."
          onChangeText={setValue}
          capitalization="sentences"
        />
      </Section>
    </ScrollPage>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
