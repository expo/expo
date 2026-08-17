import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Home screen that links to every route shape the integration must support:
// static, dynamic [id], rest [...slug], grouped (marketing), modal, and a
// deliberately-broken href to trigger +not-found.
export default function Home() {
  const router = useRouter();
  const link = { color: '#0a84ff', fontSize: 18, marginVertical: 6 } as const;
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 8 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Rollipop + Expo Router</Text>
      <Link href="/about" style={link}>
        Static: /about
      </Link>
      <Link href="/users" style={link}>
        Nested layout: /users
      </Link>
      <Link href="/users/42" style={link}>
        Dynamic: /users/42
      </Link>
      <Link href="/blog/2026/08/hello" style={link}>
        Rest: /blog/2026/08/hello
      </Link>
      <Link href="/pricing" style={link}>
        Group (folds up): /pricing
      </Link>
      <Link href="/terms" style={link}>
        Group (folds up): /terms
      </Link>
      <Link href="/modal" style={link}>
        Modal: /modal
      </Link>
      <Link href="/this-route-does-not-exist" style={link}>
        Not-found: /this-route-does-not-exist
      </Link>
      <Pressable onPress={() => router.push('/about')}>
        <Text style={link}>Push /about (imperative)</Text>
      </Pressable>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
