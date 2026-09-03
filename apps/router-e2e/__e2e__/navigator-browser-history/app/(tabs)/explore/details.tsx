import { Link, usePathname } from 'expo-router';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function DetailsScreen() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  return (
    <View>
      <Text testID="details-content">{pathname}</Text>
      <Text testID="details-count">{count}</Text>
      <Button testID="increment-details" title="Increment" onPress={() => setCount(count + 1)} />
      <Link href="/(tabs)/explore/final" testID="go-final">
        Go Final
      </Link>
    </View>
  );
}
