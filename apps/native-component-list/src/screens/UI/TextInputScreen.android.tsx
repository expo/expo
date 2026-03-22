import {
  TextInput,
  TextInputRef,
  Button,
  Host,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
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
          onClick={async () => {
            textRef.current?.setText('Hello there!');
          }}>
          <ComposeText>Set text</ComposeText>
        </Button>
      </Host>
      <Section title="Text Input">
        <Host matchContents>
          <TextInput
            ref={textRef}
            autocorrection={false}
            defaultValue="hey there"
            onChangeText={setValue}>
            <TextInput.Label>
              <ComposeText>Filled Label</ComposeText>
            </TextInput.Label>
          </TextInput>
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

      <Section title="Outlined Text Input">
        <Host matchContents>
          <TextInput variant="outlined" defaultValue="Outlined" onChangeText={setValue}>
            <TextInput.Label>
              <ComposeText>Outlined Label</ComposeText>
            </TextInput.Label>
          </TextInput>
        </Host>
        <Host matchContents>
          <TextInput
            variant="outlined"
            multiline
            numberOfLines={3}
            defaultValue="Outlined multiline"
            onChangeText={setValue}>
            <TextInput.Label>
              <ComposeText>Outlined multiline</ComposeText>
            </TextInput.Label>
          </TextInput>
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
