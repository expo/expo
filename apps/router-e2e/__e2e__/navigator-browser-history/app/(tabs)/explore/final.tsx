import { router, usePathname } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function FinalScreen() {
  return (
    <View>
      <Text testID="final-content">{usePathname()}</Text>
      <Button testID="final-back" title="Back" onPress={() => router.back()} />
    </View>
  );
}
