import { Link } from 'expo-router';
import { Text, View } from 'react-native';

// Modal screen. The root layout registers `modal` with presentation: 'modal',
// so Expo Router renders it above the stack. Exercises the modal path of
// getRoutes / the navigation container.
export default function Modal() {
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 22 }}>Modal</Text>
      <Link href="/" style={{ color: '#0a84ff', marginTop: 12 }}>
        Dismiss
      </Link>
    </View>
  );
}
