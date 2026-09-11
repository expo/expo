import { usePathname } from 'expo-router';
import { Text } from 'react-native';

export default function FinalScreen() {
  return <Text testID="final-content">{usePathname()}</Text>;
}
