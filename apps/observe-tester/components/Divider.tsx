import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/utils/theme';

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border.secondary }, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginVertical: 20,
  },
});
