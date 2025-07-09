import { useTheme } from 'ThemeProvider';
import { View } from 'react-native';

export function TabBackground() {
  const { theme } = useTheme();
  return <View style={{ flex: 1, backgroundColor: theme.background.default }} />;
}
