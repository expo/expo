import {
  Button,
  Card,
  Host,
  RNHostView,
  Text as ComposeText,
  TextField,
} from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { E2EKeyValueBox } from '../../components/E2EKeyValueBox';

// Controls inside a Pressable. A finger tap moves a little, and before
// https://github.com/expo/expo/issues/52066 the Pressable took that press from the control.
// Each control fills its row, so the e2e test can tap anywhere near the row's center.
export default function HostInPressableScreen() {
  const [counts, setCounts] = useState<Record<string, number>>({});
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
          textFieldFocus: value('textFieldFocus'),
          textFieldPressable: value('textFieldPressable'),
          cardPressable: value('cardPressable'),
          hostedPressable: value('hostedPressable'),
          outerPressable: value('outerPressable'),
        }}
      />
      <Pressable style={styles.row} onPress={count('buttonPressable')}>
        <Host style={styles.host}>
          <Button modifiers={[fillMaxSize()]} onClick={count('button')}>
            <ComposeText>Button</ComposeText>
          </Button>
        </Host>
      </Pressable>
      <Pressable style={styles.row} onPress={count('textFieldPressable')}>
        <Host style={styles.host}>
          <TextField
            modifiers={[fillMaxSize()]}
            onFocusChanged={(focused) => focused && count('textFieldFocus')()}
          />
        </Host>
      </Pressable>
      <Pressable style={styles.row} onPress={count('cardPressable')}>
        <Host style={styles.host}>
          <Card modifiers={[fillMaxSize()]}>
            <ComposeText>Card</ComposeText>
          </Card>
        </Host>
      </Pressable>
      <Pressable style={styles.row} onPress={count('outerPressable')}>
        <Host style={styles.host}>
          <RNHostView>
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
  box: { maxHeight: 150 },
  row: { flex: 1, padding: 6, borderWidth: 1, borderColor: '#999', borderRadius: 8 },
  host: { flex: 1 },
  hosted: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#acf' },
});
