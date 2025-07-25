import { TextInput } from '@expo/ui/swift-ui';
import * as React from 'react';
import { Text } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function TextInputScreen() {
  const [value, setValue] = React.useState<string>('');

  function focus() {
    console.log("focus")
  }

  function blur() {
    console.log("blur")
  }

  return (
    <Page>
      <Section title="Text input">
        <TextInput
          multiline
          placeholder='Valor'
          numberOfLines={5}
          autocorrection={false}
          onChangeText={setValue}
          onTextFieldFocus={focus}
          onTextFieldBlur={blur}
          secureEntry
          style={{color:"#4287f5", size: 40, fontFamily: "HelveticaNeue-Light", fontWeight: "100"}}
         // mask={'[Aa0]{-}[00]{-}[AAAAAAAAAA]'}
        />
      </Section>
    </Page>
  );
}

TextInputScreen.navigationOptions = {
  title: 'TextInput',
};
