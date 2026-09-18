import { router, usePathname } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function AnchoredDetailsScreen() {
  const pathname = usePathname();
  return (
    <View>
      <Text testID="anchored-details-content">{pathname}</Text>
      <Button testID="anchored-back" title="Back" onPress={() => router.back()} />
    </View>
  );
}
