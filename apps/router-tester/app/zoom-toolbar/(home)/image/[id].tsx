import { Image } from 'expo-image';
import { Link, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Text, View, useWindowDimensions } from 'react-native';

export default function ImageScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [taps, setTaps] = useState(0);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button
          variant="prominent"
          tintColor="red"
          icon="trash"
          accessibilityLabel="Delete photo"
          onPress={() => setTaps((count) => count + 1)}
        />
      </Stack.Toolbar>
      <Link.AppleZoomTarget>
        <Image source={require('@/assets/frog.jpg')} style={{ width, height: width * (4 / 3) }} />
      </Link.AppleZoomTarget>
      <Text testID="toolbar-taps">Toolbar taps: {taps}</Text>
      <Button title="Back to photos" onPress={() => router.back()} />
    </View>
  );
}
