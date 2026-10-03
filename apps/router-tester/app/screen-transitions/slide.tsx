import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Slide() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#FFE8B3',
      }}>
      <Text>Slide</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => router.back()}
        style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>Back</Text>
      </Pressable>
    </View>
  );
}
