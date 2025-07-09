import { useGlobalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export async function generateStaticParams() {
  return ['welcome-to-the-universe', 'other'].map((post) => ({ post }));
}

export default function Post() {
  const params = useGlobalSearchParams();
  return <Text>Post: {params.post}</Text>;
}
