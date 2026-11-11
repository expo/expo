import { Link, router, usePathname } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function ExploreScreen() {
  const pathname = usePathname();
  return (
    <View>
      <Text testID="explore-content">{pathname}</Text>
      <Link href="/(tabs)/explore/details" testID="go-details">
        Go Details
      </Link>
      <Pressable
        testID="push-details-and-final"
        onPress={() => {
          router.push('/(tabs)/explore/details');
          router.push('/(tabs)/explore/final');
        }}>
        <Text>Push details and final</Text>
      </Pressable>
      <Link href="/(tabs)" testID="go-home">
        Go Home
      </Link>
    </View>
  );
}
