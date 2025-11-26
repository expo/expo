import { useRouter } from 'expo-router';
import { Toolbar } from 'expo-router/unstable-toolbar';
import { Button, Text, View } from 'react-native';

export default function Modal() {
  const router = useRouter();
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text>Modal</Text>
      <Button title="Close" onPress={() => router.back()} />
      {/* Toolbar is not visible when presentation is modal */}
      <Toolbar>
        <Toolbar.Spacer />
        <Toolbar.Button sf="gear" />
        <Toolbar.Spacer />
      </Toolbar>
    </View>
  );
}
