import { Link, usePathname } from 'expo-router';
import { View, Text } from 'react-native';

export default function ExploreScreen() {
  const pathname = usePathname();
  return (
    <View>
      <Text testID="explore-content">{pathname}</Text>
      <Link href="/(tabs)/explore/details" testID="go-details">
        Go Details
      </Link>
      <Link href="/(tabs)" testID="go-home">
        Go Home
      </Link>
    </View>
  );
}
