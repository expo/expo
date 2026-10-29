import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Button, Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ZoomDestScreen() {
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ gestureEnabled: gesturesEnabled }} />
      <View
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          height: 100,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Button
          title={gesturesEnabled ? 'Disable gestures' : 'Enable gestures'}
          onPress={() => setGesturesEnabled((enabled) => !enabled)}
        />
      </View>
      <Link.AppleZoomTarget>
        <View style={{ width: '100%', aspectRatio: 1 }}>
          <Image source={require('@/assets/frog.jpg')} style={{ width: '100%', height: '100%' }} />
        </View>
      </Link.AppleZoomTarget>
    </SafeAreaView>
  );
}
