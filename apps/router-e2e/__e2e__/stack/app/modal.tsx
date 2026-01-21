import { Stack, useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Modal() {
  const router = useRouter();
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text>Modal</Text>
      <Button title="Close" onPress={() => router.back()} />
      {/* Toolbar is not visible when presentation is modal */}
      <Stack.Toolbar>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button icon="gear" />
        <Stack.Toolbar.Spacer />
      </Stack.Toolbar>
    </View>
  );
}
