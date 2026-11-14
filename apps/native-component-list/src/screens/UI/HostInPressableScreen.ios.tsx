import { Button, Host, RNHostView, Switch, Text as UIText, TextInput } from '@expo/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { E2EKeyValueBox } from '../../components/E2EKeyValueBox';

// Controls inside a Pressable. A SwiftUI control takes the tap, and the Pressable fires only for
// content that doesn't handle touches. `accessible={false}` keeps the controls visible to the e2e test.
export default function HostInPressableScreen() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const count = (key: string) => () => setCounts((c) => ({ ...c, [key]: (c[key] ?? 0) + 1 }));
  const value = (key: string) => counts[key] ?? 0;

  return (
    <View style={styles.screen}>
      <E2EKeyValueBox
        title="Presses"
        style={styles.box}
        entries={{
          button: value('button'),
          buttonPressable: value('buttonPressable'),
          switch: isSwitchOn,
          switchPressable: value('switchPressable'),
          textInputFocus: value('textInputFocus'),
          textInputPressable: value('textInputPressable'),
          textPressable: value('textPressable'),
          hostedPressable: value('hostedPressable'),
          outerPressable: value('outerPressable'),
        }}
      />
      <Pressable accessible={false} style={styles.row} onPress={count('buttonPressable')}>
        <Host matchContents>
          <Button label="Button" testID="button" onPress={count('button')} />
        </Host>
      </Pressable>
      <Pressable accessible={false} style={styles.row} onPress={count('switchPressable')}>
        <Host matchContents>
          <Switch testID="switch" value={isSwitchOn} onValueChange={setIsSwitchOn} />
        </Host>
      </Pressable>
      <Pressable accessible={false} style={styles.row} onPress={count('textInputPressable')}>
        <Host matchContents={{ vertical: true }} style={styles.field}>
          <TextInput placeholder="TextInput" onFocus={count('textInputFocus')} />
        </Host>
      </Pressable>
      <Pressable accessible={false} style={styles.row} onPress={count('textPressable')}>
        <Host matchContents>
          <UIText>Plain text</UIText>
        </Host>
      </Pressable>
      <Pressable accessible={false} style={styles.row} onPress={count('outerPressable')}>
        <Host matchContents>
          <RNHostView matchContents>
            <Pressable style={styles.hosted} onPress={count('hostedPressable')}>
              <Text>Hosted Pressable</Text>
            </Pressable>
          </RNHostView>
        </Host>
      </Pressable>
    </View>
  );
}

HostInPressableScreen.navigationOptions = {
  title: 'Host in Pressable',
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, gap: 8 },
  box: { maxHeight: 200 },
  row: {
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
  },
  field: { alignSelf: 'stretch' },
  hosted: { padding: 12, backgroundColor: '#acf' },
});
