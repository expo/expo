import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { box } from './styles';
import { colors } from './theme';

interface TableProps {
  children: ReactNode;
}

export function Table({ children }: TableProps) {
  return <View style={[box.container, styles.table]}>{children}</View>;
}

interface TableRowProps {
  label: string;
  children: ReactNode;
}

export function TableRow({ label, children }: TableRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.spacer} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 100,
  },
  spacer: {
    flex: 1,
  },
});
