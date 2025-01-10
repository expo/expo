// This route is dynamic with build-time static pages.
import { Text } from 'react-native';

export async function generateStaticParams() {
  return [{ color: 'red' }, { color: 'blue' }];
}

export default function ColorRoute({ color }) {
  return (
    <Text testID="color">
      {color}-{process.env.E2E_BUILD_MARKER}
    </Text>
  );
}
