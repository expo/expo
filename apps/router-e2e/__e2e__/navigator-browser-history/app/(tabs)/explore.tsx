import { View, Text } from 'react-native';
import { Link, usePathname } from 'expo-router';

export default function TabTwoScreen() {
  const pathname = usePathname();
  return (
    <View>
      <Text testID='explore-content'>{pathname}</Text>
      <Link href='/(tabs)' testID='go-home'>Go Home</Link>
    </View>
  );
}
