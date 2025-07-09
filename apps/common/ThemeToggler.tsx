import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Platform } from 'react-native';

import { useTheme } from './ThemeProvider';

export default function ThemeToggler() {
  const { theme, name, setTheme } = useTheme();
  return (
    <TouchableOpacity onPress={() => setTheme(name === 'light' ? 'dark' : 'light')} hitSlop={4}>
      <Ionicons
        name={name === 'dark' ? 'sunny' : 'moon'}
        size={Platform.OS === 'ios' ? 22 : 25}
        color={theme.icon.info}
      />
    </TouchableOpacity>
  );
}
