import { Link, usePathname } from 'expo-router';
import { Text, View } from 'react-native';

export default function AnchoredIndexScreen() {
  const pathname = usePathname();
  return (
    <View>
      <Text testID="anchored-content">{pathname}</Text>
      <Link href="/(tabs)/anchored/details" testID="go-anchored-details">
        Go Anchored Details
      </Link>
    </View>
  );
}
