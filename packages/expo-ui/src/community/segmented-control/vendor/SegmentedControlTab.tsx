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
  activeTextColor,
  inactiveTextColor,
  appearance,
  accessibilityHint,
}: {
  value: string;
  tintColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  onSelect: () => void;
  selected: boolean;
  enabled: boolean;
  appearance?: 'dark' | 'light' | null;
  accessibilityHint?: string;
}) {
  const colorSchemeHook = useColorScheme();
  const colorScheme = appearance || colorSchemeHook;

  const defaultActiveColor = tintColor ? 'white' : colorScheme === 'dark' ? '#FFF' : '#000';
  const defaultInactiveColor = colorScheme === 'dark' ? '#8E8E93' : '#3C3C43';

  const activeColor = activeTextColor ?? defaultActiveColor;
  const inactiveColor = inactiveTextColor ?? defaultInactiveColor;

  const activeStyle = {
    ...styles.activeText,
    color: activeColor,
  };

  const idleStyle = {
    color: inactiveColor,
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
