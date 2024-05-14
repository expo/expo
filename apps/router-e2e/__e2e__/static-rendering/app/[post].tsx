import { router, useGlobalSearchParams, Href, Link, Router } from 'expo-router';
import { Text } from 'react-native';

export async function generateStaticParams() {
  return ['welcome-to-the-universe', 'other'].map((post) => ({ post }));
}

export default function Post() {
  const params = useGlobalSearchParams();
  const a: Href = '/';
  const b = <Link href="/"> Home </Link>;
  type a = (typeof router)['back'];
  console.log(a);
  router.push('asdf');
  return <Text>Post: {params.post}</Text>;
}
