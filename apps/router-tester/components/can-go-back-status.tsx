import { useCanGoBack } from 'expo-router';
import { Text } from 'react-native';

export function CanGoBackStatus() {
  return <Text testID="e2e-use-can-go-back">useCanGoBack: {String(useCanGoBack())}</Text>;
}
