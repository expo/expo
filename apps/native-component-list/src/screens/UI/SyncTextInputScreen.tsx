import 'react-native-reanimated';

import { Host, Form, Section } from '@expo/ui/swift-ui';
import { SyncTextField } from '@expo/ui/swift-ui/TextField/Sync';
import { listSectionSpacing, scrollDismissesKeyboard } from '@expo/ui/swift-ui/modifiers';
import { installOnUIRuntime } from 'expo';
import * as React from 'react';

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
          <SyncTextField onChangeTextSync={onChangeTextSync} />
        </Section>
      </Form>
    </Host>
  );
}

SyncTextInputScreen.navigationOptions = {
  title: 'Sync TextInput',
};
