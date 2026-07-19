import { Link, usePathname } from 'expo-router';
import { View, Text } from 'react-native';

export default function HomeScreen() {
  const pathname = usePathname();
  return (
    <View>
      <Text testID="home-content">{pathname}</Text>
      <Link href="/(tabs)/explore" testID="go-explore">
        Go Explore
      </Link>
    </View>
  );
}
