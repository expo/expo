import { Stack } from 'expo-router';
import { useState } from 'react';
import { Button, ScrollView, Text, useWindowDimensions } from 'react-native';

import { StackProbe } from './split-stack-scope-probe';

export function SplitStackTraits() {
  const [hidden, setHidden] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const { width, height } = useWindowDimensions();
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Stack.Screen
        options={{
          statusBarHidden: hidden,
          statusBarStyle: 'dark',
          orientation: landscape ? 'landscape' : 'portrait',
        }}
      />
      <Text>Deeper Stack traits</Text>
      <Text>Requested status bar: {hidden ? 'hidden' : 'visible'}</Text>
      <Button title="Toggle child status bar" onPress={() => setHidden((value) => !value)} />
      <Text>Requested orientation: {landscape ? 'landscape' : 'portrait'}</Text>
      <Button title="Toggle child orientation" onPress={() => setLandscape((value) => !value)} />
      <Text>
        Window: {width} × {height}
      </Text>
      <Text>
        Compare with /split-view-traits-baseline. This child Stack hides its own header; the
        containing Stack remains the content column's header owner.
      </Text>
      <StackProbe />
    </ScrollView>
  );
}
