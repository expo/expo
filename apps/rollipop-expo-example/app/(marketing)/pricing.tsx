import { Link } from 'expo-router';
import { Text, View } from 'react-native';

// Folded-up route: reachable at /pricing (the (marketing) group is invisible).
export default function Pricing() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22 }}>Pricing</Text>
      <Link href="/terms" style={{ color: '#0a84ff', marginTop: 12 }}>
        Go to Terms
      </Link>
    </View>
  );
}
