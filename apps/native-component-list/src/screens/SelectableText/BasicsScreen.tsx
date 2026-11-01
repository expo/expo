import { Text, type SelectionMenuActionEvent } from 'expo-selectable-text';
import * as React from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';

export default function BasicsScreen() {
  const [lastAction, setLastAction] = React.useState('None');
  const [presses, setPresses] = React.useState(0);

  const onAction = (name: string) => (event: SelectionMenuActionEvent) => {
    setLastAction(`${name}: "${event.selectedText}" [${event.start}, ${event.end})`);
  };

  const menu = (
    <Text.Menu>
      <Text.MenuAction onPress={onAction('Add to chat')}>Add to chat</Text.MenuAction>
      <Text.MenuAction onPress={onAction('Quote')}>Quote</Text.MenuAction>
    </Text.Menu>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <RNText style={styles.status} testID="last-action">
        Last action: {lastAction}
      </RNText>
      <RNText style={styles.status} testID="link-presses">
        Link presses: {presses}
      </RNText>

      <Section title="Plain paragraph">
        <Text selectable style={styles.body}>
          {menu}
          Long press to select part of this text, then pick a custom action from the menu.
        </Text>
        <RNText selectable style={styles.body}>
          Long press to select part of this text, then pick a custom action from the menu.
        </RNText>
      </Section>

      <Section title="Nested styles and a pressable link">
        <Text selectable style={styles.body}>
          {menu}
          Some <RNText style={styles.bold}>bold</RNText>, some{' '}
          <RNText style={styles.italic}>italic</RNText>, and a{' '}
          <RNText style={styles.link} onPress={() => setPresses((count) => count + 1)}>
            pressable link
          </RNText>{' '}
          in one paragraph.
        </Text>
        <RNText selectable style={styles.body}>
          Some <RNText style={styles.bold}>bold</RNText>, some{' '}
          <RNText style={styles.italic}>italic</RNText>, and a{' '}
          <RNText style={styles.link} onPress={() => setPresses((count) => count + 1)}>
            pressable link
          </RNText>{' '}
          in one paragraph.
        </RNText>
      </Section>

      <Section title="numberOfLines and decorations">
        <Text selectable numberOfLines={2} style={[styles.body, styles.decorated]}>
          {menu}
          This paragraph is truncated after two lines. It has an underline and a padded background
          so that the selection highlight and the drawn glyphs can be compared with the control
          below, which is React Native Text with the same props.
        </Text>
        <RNText selectable numberOfLines={2} style={[styles.body, styles.decorated]}>
          This paragraph is truncated after two lines. It has an underline and a padded background
          so that the selection highlight and the drawn glyphs can be compared with the control
          below, which is React Native Text with the same props.
        </RNText>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <RNText style={styles.sectionTitle}>{title}</RNText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  status: {
    fontFamily: 'Menlo',
    fontSize: 12,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    opacity: 0.6,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: '#0a66d8',
  },
  decorated: {
    textDecorationLine: 'underline',
    backgroundColor: '#fff3c4',
    padding: 8,
  },
});
