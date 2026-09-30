import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#fff',
      }}>
      <Text>Screen transitions - Blank Stack</Text>
      <Link href="/screen-transitions/slide" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Slide"
          style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Slide</Text>
        </Pressable>
      </Link>
      <Link href="/screen-transitions/zoom" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom"
          style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Zoom</Text>
        </Pressable>
      </Link>
    </View>
  );
}
