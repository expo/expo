import { View, Text } from 'react-native';
import { Link, usePathname } from 'expo-router';

export default function HomeScreen() {
  const pathname = usePathname();
  return (
    <View>
      <Text testID='home-content'>{pathname}</Text>
      <Link href='/(tabs)/explore' testID='go-explore'>Go Explore</Link>
    </View>
  );
}
