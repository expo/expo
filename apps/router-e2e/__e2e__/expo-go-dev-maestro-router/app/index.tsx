import { Link } from 'expo-router';
import { Text } from 'react-native';

export default function Index() {
  return (
    <>
      <Text>Index</Text>
      <Link href="/(stack)">/(stack)</Link>
      <Link href="/(tabs)">/(tabs)</Link>
    </>
  );
}
