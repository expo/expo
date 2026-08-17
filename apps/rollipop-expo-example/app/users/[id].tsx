import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

// Dynamic route. `getRoutes` must parse the `[id]` segment and expose `id`
// via the search params.
export default function User() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22 }}>User {String(id)}</Text>
    </View>
  );
}
