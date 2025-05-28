import { Text } from 'react-native';

import { Link } from '@/components/Link';

export default function Index() {
  return (
    <>
      <Text>Index</Text>
      <Link href="/(stack)" preview>
        /(stack)
      </Link>
      <Link href="/(tabs)">/(tabs)</Link>
    </>
  );
}
