import { usePathname } from 'expo-router';
import { Text, View } from 'react-native';

export default function ScreenB() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Screen B</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Text>The home screen is hidden at this depth. Go back to check its state.</Text>
    </View>
  );
}
