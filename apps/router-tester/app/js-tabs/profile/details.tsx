import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function ProfileDetails() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text testID="e2e-screen">Profile Details</Text>
      <Text testID="e2e-pathname">{pathname}</Text>
      <Pressable
        testID="e2e-go-back"
        onPress={() => router.back()}
        style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>Go Back</Text>
      </Pressable>
    </View>
  );
}
