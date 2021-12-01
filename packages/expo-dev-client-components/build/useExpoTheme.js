import { lightTheme, darkTheme } from '@expo/styleguide-native';
import { useColorScheme } from 'react-native';
export function useExpoTheme() {
    const colorScheme = useColorScheme();
    if (colorScheme === 'dark') {
        return darkTheme;
    }
    return lightTheme;
}
//# sourceMappingURL=useExpoTheme.js.map