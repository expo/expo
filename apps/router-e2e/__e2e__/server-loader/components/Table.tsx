import { Text, View, StyleSheet, Platform } from "react-native";
import { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
}

export function Table({ children }: TableProps) {
  return (
    <View style={styles.tableContainer}>
      {children}
    </View>
  );
}

interface TableRowProps {
  label: string;
  value: any;
  testID: string;
}

export function TableRow({ label, value, testID }: TableRowProps) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text testID={testID} style={styles.tableValue}>
        {JSON.stringify(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    borderWidth: 1,
    borderColor: '#313538',
    backgroundColor: '#151718',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 20,
    gap: 16,
    minWidth: 300,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tableLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 100,
  },
  tableValue: {
    color: 'white',
    fontSize: 14,
    opacity: 0.7,
    fontFamily: Platform.select({
      default: `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
      ios: 'ui-monospace',
      android: 'monospace',
    }),
    fontWeight: '500',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
});