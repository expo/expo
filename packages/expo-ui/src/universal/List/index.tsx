import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListForEach } from './ListForEach';
import { ListScrollContext } from './ListScrollContext';
import type { ListProps } from './types';

/**
 * A vertical container of rows.
 * Typically populated with [`ListItem`](#listitem) children.
 */
export function List({ children, testID }: ListProps) {
  const ref = useRef(null);
  return (
    <View ref={ref} style={styles.container} testID={testID}>
      <ListScrollContext.Provider value={ref}>{children}</ListScrollContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    overflowX: 'auto',
    overflowY: 'auto',
  },
});

List.ForEach = ListForEach;

export { ListForEach } from './ListForEach';

export * from './types';
