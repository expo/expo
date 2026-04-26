/**
 * Vendored from @react-native-segmented-control/segmented-control (MIT license).
 * https://github.com/react-native-segmented-control/segmented-control
 */

import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

export function SegmentedControlTab({
  onSelect,
  value,
  enabled,
  selected,
  tintColor,
  appearance,
  accessibilityHint,
}: {
  value: string;
  tintColor?: string;
  onSelect: () => void;
  selected: boolean;
  enabled: boolean;
  appearance?: 'dark' | 'light' | null;
  accessibilityHint?: string;
}) {
  const colorSchemeHook = useColorScheme();
  const colorScheme = appearance || colorSchemeHook;

  const getColor = () => {
    if (tintColor) {
      return 'white';
    }
    return colorScheme === 'dark' ? '#FFF' : '#000';
  };
  const color = getColor();

  const activeStyle = {
    ...styles.activeText,
    color,
  };

  const idleStyle = {
    color,
  };

  return (
    <TouchableOpacity
      style={styles.container}
      disabled={!enabled}
      onPress={onSelect}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !enabled }}>
      <View style={styles.default}>
        <Text style={[idleStyle, selected && activeStyle]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 5 },
  default: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 5,
  },
  activeText: {
    fontWeight: '700',
  },
});
