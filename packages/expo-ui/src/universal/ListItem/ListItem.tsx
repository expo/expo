import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { extractListItemSlots } from './ListItemSlots';
import type { ListItemProps } from './types';

function renderSupporting(node: ReactNode): ReactNode {
  if (typeof node === 'string') {
    return <Text style={styles.supportingText}>{node}</Text>;
  }
  return node;
}

/**
 * A tappable row in a list.
 * Composes with [`List`](#list).
 * Pass row content via the `leading` / `trailing` / `supportingText` shorthand props or the compound `<ListItem.Leading>` / `<ListItem.Trailing>` / `<ListItem.Supporting>` slot children.
 */
export function ListItem(props: ListItemProps) {
  const {
    children,
    onPress,
    leading: leadingProp,
    trailing: trailingProp,
    supportingText,
    testID,
  } = props;
  const slots = extractListItemSlots(children);
  const leading = slots.leading ?? leadingProp;
  const trailing = slots.trailing ?? trailingProp;
  const supporting = slots.supporting ?? supportingText;

  return (
    <Pressable onPress={onPress} style={styles.row} testID={testID}>
      {leading != null ? <View style={styles.slot}>{leading}</View> : null}
      <View style={styles.main}>
        <Text>{slots.headline}</Text>
        {supporting != null ? renderSupporting(supporting) : null}
      </View>
      {trailing != null ? <View style={styles.slot}>{trailing}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    cursor: 'pointer',
  },
  main: {
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  supportingText: {
    fontSize: 13,
    color: '#6b7280',
  },
});

export * from './types';
