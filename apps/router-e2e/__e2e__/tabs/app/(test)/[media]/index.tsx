import { Text } from 'react-native';
import { Link, useLocalSearchParams, usePathname } from 'expo-router';

export default function Value() {
  return (
    <>
      <Text>{JSON.stringify({ params: useLocalSearchParams(), pathname: usePathname() })}</Text>
      <Link href="/people">People</Link>
      <Link href="/movies">Movies</Link>
      <Link href="/tv">TV</Link>
    </>
  );
}
