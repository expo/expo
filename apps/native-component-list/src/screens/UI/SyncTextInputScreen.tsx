import 'react-native-reanimated';

import { Host, Form, Section } from '@expo/ui/swift-ui';
import { TextField, TextFieldRef } from '@expo/ui/swift-ui/TextField/Sync';
import { listSectionSpacing, scrollDismissesKeyboard } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { installOnUIRuntime } from 'expo';

installOnUIRuntime();

export default function SyncTextInputScreen() {
  const onChangeTextSync = React.useCallback((value: string) => {
    'worklet';
    console.log('onChangeTextSync from worklet: ', value);
  }, []);

  return (
    <Host style={{ flex: 1 }}>
      <Form modifiers={[listSectionSpacing('compact'), scrollDismissesKeyboard('interactively')]}>
        <Section title="Text Input">
          <TextField
            autocorrection={false}
            defaultValue="hey there"
            onChangeTextSync={onChangeTextSync}
          />
        </Section>
      </Form>
    </Host>
  );
}

SyncTextInputScreen.navigationOptions = {
  title: 'Sync TextInput',
};
