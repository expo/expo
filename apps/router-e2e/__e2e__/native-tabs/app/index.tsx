import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { Faces } from '../components/faces';
import { Post } from '../components/Post';

export default function Index() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{
        justifyContent: 'center',
        // alignItems: 'center',
        padding: 32,
        gap: 16,
      }}>
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center' }}>
        Good Afternoon
      </Text>
      <Text style={{ color: '#ddd', fontSize: 24, marginBottom: 16, textAlign: 'center' }}>
        If you have a watch, this is an app for you!
      </Text>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Best faces</Text>
      <Faces numberOfFaces={3} />
      <Link href="/faces" style={{ color: '#fff', fontSize: 18 }}>
        <Link.Trigger>See all faces</Link.Trigger>
        <Link.Preview />
      </Link>

      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Latest news</Text>
      <Post title="New watches in August" href="/explore/news/new-watches-august" />
      <Link href="/explore" style={{ color: '#fff', fontSize: 18 }}>
        <Link.Trigger>See all news</Link.Trigger>
        <Link.Preview />
      </Link>

      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Additional links</Text>
      <Link href="/404" style={{ color: '#fff', fontSize: 18 }}>
        Try and go to 404
      </Link>
      <Link href="/_sitemap" style={{ color: '#fff', fontSize: 18 }}>
        Sitemap is here
      </Link>
    </ScrollView>
  );
}
