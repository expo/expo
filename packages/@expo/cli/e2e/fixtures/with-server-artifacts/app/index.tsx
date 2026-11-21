import { useLoaderData } from 'expo-router';
import { Text } from 'react-native';

export async function loader() {
  const { message } = await import('../data');
  return { message };
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return <Text>{data.message}</Text>;
}
