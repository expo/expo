import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

// Rest (catch-all) route. `getRoutes` must parse the `[...slug]` rest segment
// and expose the captured path array via search params.
export default function BlogPost() {
  const { slug } = useLocalSearchParams();
  const parts = Array.isArray(slug) ? slug : slug ? [slug] : [];
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20 }}>Blog post</Text>
      <Text style={{ marginTop: 8, color: '#666' }}>/{parts.join('/')}</Text>
    </View>
  );
}
