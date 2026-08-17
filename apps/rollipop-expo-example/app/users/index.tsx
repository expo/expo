import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

const USERS = [1, 2, 42, 99];

export default function UsersIndex() {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Users</Text>
      {USERS.map((id) => (
        <Link key={id} href={`/users/${id}`} style={{ color: '#0a84ff', fontSize: 18 }}>
          User {id}
        </Link>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}
