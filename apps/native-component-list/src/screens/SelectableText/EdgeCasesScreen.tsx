import { SelectableText, type SelectionMenuActionEvent } from 'expo-selectable-text';
import * as React from 'react';
import {
  Button,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';

const RTL = 'مرحبا بك في هذا التطبيق، اضغط مطولا لتحديد جزء من النص.';
const EMOJI = 'Hi 👋🏽 family 👨‍👩‍👧 and café ☕️ end of line.';
const MODAL_TEXT = 'Text inside a modal. Select a word, then tap outside to clear it.';
const MENU = [{ id: 'add-to-chat', title: 'Add to chat' }];
const LONG = Array.from(
  { length: 40 },
  (_, i) => `Sentence ${i + 1} of a long bot message that keeps going.`
).join(' ');

export default function EdgeCasesScreen() {
  const [status, setStatus] = React.useState('None');
  const [rootPresses, setRootPresses] = React.useState(0);
  const [inlinePresses, setInlinePresses] = React.useState(0);
  const [tick, setTick] = React.useState(0);
  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const menuProps = (name: string, source: string) => ({
    menu: MENU,
    onMenuAction: (event: SelectionMenuActionEvent) => {
      const match = source.slice(event.start, event.end) === event.selectedText;
      setStatus(
        `${name}: ${JSON.stringify(event.selectedText)} [${event.start}, ${event.end}) slice-match=${match ? 'YES' : 'NO'}`
      );
    },
  });

  const changing = `Changing text, tick ${tick}. Select a word while this number updates.`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <RNText style={[styles.status, styles.statusBox]} numberOfLines={3} testID="status">
        {status}
      </RNText>
      <RNText style={styles.status} testID="root-presses">
        Root presses: {rootPresses} | Inline presses: {inlinePresses}
      </RNText>

      <RNText style={styles.title}>RTL</RNText>
      <SelectableText {...menuProps('rtl', RTL)}>
        <RNText style={styles.body}>{RTL}</RNText>
      </SelectableText>
      <RNText selectable style={styles.body}>
        {RTL}
      </RNText>

      <RNText style={styles.title}>Emoji and surrogate pairs</RNText>
      <SelectableText {...menuProps('emoji', EMOJI)}>
        <RNText style={styles.body}>{EMOJI}</RNText>
      </SelectableText>
      <RNText selectable style={styles.body}>
        {EMOJI}
      </RNText>

      <RNText style={styles.title}>Inline view</RNText>
      <SelectableText {...menuProps('inline', 'Before ￼ after the inline view.')}>
        <RNText style={styles.body}>
          Before{' '}
          <Pressable
            style={styles.inlineView}
            onPress={() => setInlinePresses((count) => count + 1)}
          />{' '}
          after the inline view.
        </RNText>
      </SelectableText>
      <RNText selectable style={styles.body}>
        Before{' '}
        <Pressable
          style={styles.inlineView}
          onPress={() => setInlinePresses((count) => count + 1)}
        />{' '}
        after the inline view.
      </RNText>

      <RNText style={styles.title}>Inline view that mounts and unmounts</RNText>
      <SelectableText {...menuProps('toggling', 'Before after a toggling inline view.')}>
        <RNText style={styles.body}>
          Before {tick % 2 === 0 ? <View style={styles.inlineView} /> : null} after a toggling
          inline view.
        </RNText>
      </SelectableText>

      <RNText style={styles.title}>Root onPress</RNText>
      <SelectableText {...menuProps('root-press', 'A short tap presses this whole paragraph.')}>
        <RNText style={styles.body} onPress={() => setRootPresses((count) => count + 1)}>
          A short tap presses this whole paragraph.
        </RNText>
      </SelectableText>

      <RNText style={styles.title}>Changing text</RNText>
      <SelectableText {...menuProps('changing', changing)}>
        <RNText style={styles.body}>{changing}</RNText>
      </SelectableText>
      <RNText selectable style={styles.body}>
        {changing}
      </RNText>

      <RNText style={styles.title}>Modal</RNText>
      <Button title="Open modal" onPress={() => setModalVisible(true)} />
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modal}>
          <RNText style={[styles.status, styles.statusBox]} numberOfLines={3}>
            {status}
          </RNText>
          <SelectableText {...menuProps('modal', MODAL_TEXT)}>
            <RNText style={styles.body}>{MODAL_TEXT}</RNText>
          </SelectableText>
          <Button title="Close modal" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>

      <RNText style={styles.title}>Long message</RNText>
      <SelectableText {...menuProps('long', LONG)}>
        <RNText style={styles.body}>{LONG}</RNText>
      </SelectableText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // A fixed height keeps the layout still while the status text changes.
  statusBox: {
    height: 46,
  },
  container: {
    padding: 16,
    gap: 8,
  },
  status: {
    fontFamily: 'Menlo',
    fontSize: 12,
  },
  title: {
    marginTop: 8,
    fontWeight: '600',
    opacity: 0.6,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
  },
  modal: {
    flex: 1,
    padding: 16,
    paddingTop: 80,
    gap: 16,
  },
  inlineView: {
    width: 16,
    height: 16,
    backgroundColor: '#e33',
  },
});
