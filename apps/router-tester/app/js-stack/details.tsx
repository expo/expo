import { Link, usePathname, useRouter } from 'expo-router';
import { Text, View, Pressable } from 'react-native';

export default function Details() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Details</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Pressable
        testID="e2e-go-back"
        onPress={() => router.back()}
        style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>Go Back</Text>
      </Pressable>
      <Link testID="e2e-goto-modal" href="/js-stack/modal" asChild>
        <Pressable style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Open Modal</Text>
        </Pressable>
      </Link>
    </View>
  );
}
