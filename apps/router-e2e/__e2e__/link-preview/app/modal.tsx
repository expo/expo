import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Modal() {
  const router = useRouter();
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      {/* <Stack.Screen options={{ title: 'Test' }} /> */}
      <Text>Modal</Text>
      <Button title="Close" onPress={() => router.back()} />
    </View>
  );
}
