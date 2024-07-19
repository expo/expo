import { Text } from 'react-native';
import { Link, useLocalSearchParams, usePathname } from 'expo-router';

export default function Page() {
  return (
    <>
      <Text>{JSON.stringify({ params: useLocalSearchParams(), pathname: usePathname() })}</Text>
      <Link href="/movies">Movies</Link>
    </>
  );
}
