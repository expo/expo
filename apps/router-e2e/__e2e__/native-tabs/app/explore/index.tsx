import { ScrollView } from 'react-native';
import { Post } from '../../components/Post';

export default function Index() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{
        padding: 32,
        gap: 16,
        width: '100%',
      }}>
      <Post title="New watches in August" href="/explore/news/new-watches-august" />
      <Post title="We are featured in a movie" href="/explore/news/we-are-featured-in-a-movie" />
      <Post title="Holiday deal 1 + 1" href="/explore/news/holiday-deal-1-1" />
      <Post title="Get family discount" href="/explore/news/get-family-discount" />
    </ScrollView>
  );
}
