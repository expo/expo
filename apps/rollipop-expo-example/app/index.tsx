import { Link, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Home() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Rollipop + Expo Router</Text>
      <Link href="/about">Go to About</Link>
      <Link href="/users/42">Go to User 42</Link>
      <Pressable onPress={() => router.push('/about')}>
        <Text>Push About</Text>
      </Pressable>
    </View>
  );
}
