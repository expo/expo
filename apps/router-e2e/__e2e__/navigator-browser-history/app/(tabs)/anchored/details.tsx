import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function AnchoredDetailsScreen() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <View>
      <Text testID="anchored-details-content">{pathname}</Text>
      <Button testID="anchored-back" title="Back" onPress={() => router.back()} />
      {mounted && <View testID="anchored-details-mounted" />}
    </View>
  );
}
