import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ padding: 60 }}>
      <Text>Query serialization</Text>
      <Link
        testID="query-link"
        href="/query?space=start%20end&plus=a%2Bb&array=first%20value&array=second%2Bvalue&unicode=caf%C3%A9%20%F0%9F%98%80&symbols=*%7E%26%3D%23%2F%3F#section">
        Open query
      </Link>
    </View>
  );
}
