import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Modal() {
  const router = useRouter();
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text>Fullscreen Modal</Text>
      <Button title="Close" onPress={() => router.back()} />
    </View>
  );
}
