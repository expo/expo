import { CustomLink, Link } from 'expo-router';
import { Text } from 'react-native';

export default function Index() {
  return (
    <>
      <Text>Index</Text>
      <CustomLink href="/(stack)" preview>
        /(stack)
      </CustomLink>
      <Link href="/(tabs)">/(tabs)</Link>
    </>
  );
}
