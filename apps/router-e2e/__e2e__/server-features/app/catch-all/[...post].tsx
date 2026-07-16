import { useGlobalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export async function generateStaticParams() {
  return ['welcome-to-the-universe', 'other'].map((post) => ({ post }));
}

export default function Post() {
  const params = useGlobalSearchParams();
  const post = params.post;
  return (
    <>
      <Text testID="post-text">Post: {post}</Text>
      {/* Middleware matcher tests read the raw segments. */}
      <Text testID="params">{Array.isArray(post) ? post.join(',') : post}</Text>
    </>
  );
}
