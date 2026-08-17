import { Link } from 'expo-router';
import { Text, View } from 'react-native';

// Not-found screen. Rendered for unknown routes (e.g. /this-route-does-not-exist).
// getRoutes appends the not-found route natively from the `+not-found` file.
export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22 }}>Not Found</Text>
      <Link href="/" style={{ color: '#0a84ff', marginTop: 12 }}>
        Go Home
      </Link>
    </View>
  );
}
