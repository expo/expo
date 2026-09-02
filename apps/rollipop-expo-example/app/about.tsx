import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function About() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20 }}>About</Text>
      <Link href="/users/42" style={{ color: '#0a84ff', marginTop: 12 }}>
        Go to User 42
      </Link>
    </View>
  );
}
