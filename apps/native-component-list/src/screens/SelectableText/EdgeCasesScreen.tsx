import { Text, type SelectionMenuActionEvent } from 'expo-selectable-text';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text as RNText } from 'react-native';

const RTL = 'مرحبا بك في هذا التطبيق، اضغط مطولا لتحديد جزء من النص.';
const EMOJI = 'Hi 👋🏽 family 👨‍👩‍👧 and café ☕️ end of line.';
const LONG = Array.from(
  { length: 40 },
  (_, i) => `Sentence ${i + 1} of a long bot message that keeps going.`
).join(' ');

export default function EdgeCasesScreen() {
  const [status, setStatus] = React.useState('None');
  const [rootPresses, setRootPresses] = React.useState(0);
  const [inlinePresses, setInlinePresses] = React.useState(0);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const menu = (name: string, source: string) => (
    <Text.Menu>
      <Text.MenuAction
        onPress={(event: SelectionMenuActionEvent) => {
          const match = source.slice(event.start, event.end) === event.selectedText;
          setStatus(
            `${name}: ${JSON.stringify(event.selectedText)} [${event.start}, ${event.end}) slice-match=${match ? 'YES' : 'NO'}`
          );
        }}>
        Add to chat
      </Text.MenuAction>
    </Text.Menu>
  );

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
      <Text selectable style={styles.body}>
        {menu('rtl', RTL)}
        {RTL}
      </Text>
      <RNText selectable style={styles.body}>
        {RTL}
      </RNText>

      <RNText style={styles.title}>Emoji and surrogate pairs</RNText>
      <Text selectable style={styles.body}>
        {menu('emoji', EMOJI)}
        {EMOJI}
      </Text>
      <RNText selectable style={styles.body}>
        {EMOJI}
      </RNText>

      <RNText style={styles.title}>Inline view</RNText>
      <Text selectable style={styles.body}>
        {menu('inline', 'Before ￼ after the inline view.')}
        Before{' '}
        <Pressable
          style={styles.inlineView}
          onPress={() => setInlinePresses((count) => count + 1)}
        />{' '}
        after the inline view.
      </Text>
      <RNText selectable style={styles.body}>
        Before{' '}
        <Pressable
          style={styles.inlineView}
          onPress={() => setInlinePresses((count) => count + 1)}
        />{' '}
        after the inline view.
      </RNText>

      <RNText style={styles.title}>Root onPress</RNText>
      <Text selectable style={styles.body} onPress={() => setRootPresses((count) => count + 1)}>
        {menu('root-press', 'A short tap presses this whole paragraph.')}A short tap presses this
        whole paragraph.
      </Text>

      <RNText style={styles.title}>Changing text</RNText>
      <Text selectable style={styles.body}>
        {menu('changing', changing)}
        {changing}
      </Text>
      <RNText selectable style={styles.body}>
        {changing}
      </RNText>

      <RNText style={styles.title}>Long message</RNText>
      <Text selectable style={styles.body}>
        {menu('long', LONG)}
        {LONG}
      </Text>
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
  inlineView: {
    width: 16,
    height: 16,
    backgroundColor: '#e33',
  },
});
