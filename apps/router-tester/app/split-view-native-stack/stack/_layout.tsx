import { Stack } from 'expo-router';
import { View } from 'react-native';

import { useNativeStackSpike } from '@/components/native-stack-spike';
import NativeStackSpikeProbe from '@/components/native-stack-spike-probe';

export default function Layout() {
  const { titleVersion, hidden, largeTitle, gestures } = useNativeStackSpike();
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ gestureEnabled: gestures }}>
        <Stack.Screen
          name="index"
          options={{
            title: `Stack root ${titleVersion}`,
            headerShown: !hidden,
            headerLargeTitle: largeTitle,
          }}
        />
        <Stack.Screen name="pushed" options={{ title: 'Pushed screen' }} />
        <Stack.Screen
          name="modal"
          options={{
            title: 'Sheet',
            presentation: 'formSheet',
            sheetAllowedDetents: [0.5, 1],
          }}
        />
        <Stack.Screen name="nested" options={{ headerShown: false }} />
      </Stack>
      <NativeStackSpikeProbe />
    </View>
  );
}
