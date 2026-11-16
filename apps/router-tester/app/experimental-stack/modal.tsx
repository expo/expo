import { usePathname, useRouter } from 'expo-router';
import { Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Modal() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Modal</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Pressable
        testID="e2e-dismiss"
        onPress={() => router.back()}
        style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>Dismiss</Text>
      </Pressable>
    </SafeAreaView>
  );
}
