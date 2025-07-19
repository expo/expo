import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function Index() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
      }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Good Afternoon</Text>
      <Text style={{ color: '#ddd', fontSize: 24, marginBottom: 16 }}>
        If you have a watch, this is an app for you!
      </Text>
      <Link href="/404" style={{ color: '#fff', fontSize: 18 }}>
        Try and go to 404
      </Link>
      <Link href="/_sitemap" style={{ color: '#fff', fontSize: 18 }}>
        Sitemap is here
      </Link>
    </ScrollView>
  );
}
