import { Link, usePathname } from 'expo-router';
import { Text, View, Pressable } from 'react-native';

export default function Home() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Home</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Link testID="e2e-goto-details" href="/experimental-stack/details" asChild>
        <Pressable style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Go to Details</Text>
        </Pressable>
      </Link>
      <Link testID="e2e-goto-modal" href="/experimental-stack/modal" asChild>
        <Pressable style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Open Modal</Text>
        </Pressable>
      </Link>
    </View>
  );
}
