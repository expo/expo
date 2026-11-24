import { Link, router, usePathname } from 'expo-router';
import { View, Text, Button } from 'react-native';

export default function HomeScreen() {
  const pathname = usePathname();
  return (
    <View>
      <Text testID="home-content">{pathname}</Text>
      <Button
        testID="push-unmounted-details-and-final"
        title="Push details and final"
        onPress={() => {
          router.push('/(tabs)/explore/details');
          router.push('/(tabs)/explore/final');
        }}
      />
      <Link href="/(tabs)/explore" testID="go-explore">
        Go Explore
      </Link>
      <Link href="/(tabs)/anchored/details" testID="go-anchored-details">
        Go Anchored Details
      </Link>
    </View>
  );
}
