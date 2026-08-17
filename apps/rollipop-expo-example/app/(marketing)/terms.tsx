import { Link } from 'expo-router';
import { Text, View } from 'react-native';

// Folded-up route: reachable at /terms.
export default function Terms() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22 }}>Terms</Text>
      <Link href="/pricing" style={{ color: '#0a84ff', marginTop: 12 }}>
        Go to Pricing
      </Link>
    </View>
  );
}
