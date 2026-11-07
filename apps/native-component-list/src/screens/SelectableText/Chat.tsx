import { Text, type SelectionMenuActionEvent } from 'expo-selectable-text';
import * as React from 'react';
import { FlatList, StyleSheet, Text as RNText, View } from 'react-native';

const MESSAGE_COUNT = 500;

type Message = { id: number; parts: [string, string, string] };

const MESSAGES: Message[] = Array.from({ length: MESSAGE_COUNT }, (_, id) => ({
  id,
  parts: [
    `Message ${id}: here is `,
    `a bold part`,
    ` and some more text${id % 3 === 0 ? ' that wraps onto another line in the bubble' : ''}.`,
  ],
}));

/**
 * A long chat list for scroll, memory, and recycling checks. `useMenu` false
 * renders React Native `Text` as the control.
 */
export default function SelectableTextChat({ useMenu }: { useMenu: boolean }) {
  const [status, setStatus] = React.useState('None');

  const renderItem = React.useCallback(
    ({ item }: { item: Message }) => {
      const source = item.parts.join('');
      const children = [
        item.parts[0],
        <RNText key="bold" style={styles.bold}>
          {item.parts[1]}
        </RNText>,
        item.parts[2],
      ];
      return (
        <View style={styles.bubble}>
          {useMenu ? (
            <Text selectable style={styles.body}>
              <Text.Menu>
                <Text.MenuAction
                  onPress={(event: SelectionMenuActionEvent) => {
                    const match = source.slice(event.start, event.end) === event.selectedText;
                    setStatus(
                      `row ${item.id}: ${JSON.stringify(event.selectedText)} slice-match=${match ? 'YES' : 'NO'}`
                    );
                  }}>
                  Add to chat
                </Text.MenuAction>
              </Text.Menu>
              {children}
            </Text>
          ) : (
            <RNText selectable style={styles.body}>
              {children}
            </RNText>
          )}
        </View>
      );
    },
    [useMenu]
  );

  return (
    <View style={styles.screen}>
      <RNText style={[styles.status, styles.statusBox]} numberOfLines={3} testID="status">
        {useMenu ? 'expo' : 'rn'} | {status}
      </RNText>
      <FlatList
        data={MESSAGES}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // A fixed height keeps the layout still while the status text changes.
  statusBox: {
    height: 46,
  },
  screen: {
    flex: 1,
  },
  status: {
    fontFamily: 'Menlo',
    fontSize: 12,
    padding: 8,
  },
  list: {
    padding: 12,
    gap: 8,
  },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#eef1f5',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
  },
});
