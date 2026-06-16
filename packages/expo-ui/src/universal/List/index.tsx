import { StyleSheet, View } from 'react-native';

import type { ListProps } from './types';

/**
 * A vertical container of rows.
 * Typically populated with [`ListItem`](#listitem) children.
 */
export function List({ children, testID, ref }: ListProps) {
  return (
    <View ref={ref} style={styles.container} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
    overflowX: 'auto',
    overflowY: 'auto',
  },
});

export * from './types';
