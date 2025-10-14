import { Redirect, useLocalSearchParams } from 'expo-router';

export default function Index() {
  const { type } = useLocalSearchParams();
  console.log('Redirecting to /{type}/0 with type:', type);
  return <Redirect href={`/${type}/0`} />;
}
