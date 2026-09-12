import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function ScreenA() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Screen A</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Text>The home screen is still visible at this depth.</Text>
      <Link testID="e2e-goto-b" href="/navigation-aware-activity/b" asChild>
        <Pressable style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Go to Screen B</Text>
        </Pressable>
      </Link>
    </View>
  );
}
