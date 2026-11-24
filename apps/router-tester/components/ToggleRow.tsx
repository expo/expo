import { View, Text, Switch, StyleSheet } from 'react-native';

type ToggleRowProps = {
  label: string;
  testID: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ToggleRow({ label, testID, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.label}>{label}</Text>
      <Switch testID={testID} value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
  },
});
