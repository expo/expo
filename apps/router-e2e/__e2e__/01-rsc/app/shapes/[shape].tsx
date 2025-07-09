// This route is fully static.

import { Text } from 'react-native';

export const unstable_settings = {
  render: 'static',
};

export async function generateStaticParams() {
  return [{ shape: 'square' }];
}

export default function ShapeRoute({ shape }) {
  return (
    <Text testID="shape">
      {shape}-{process.env.E2E_BUILD_MARKER}
    </Text>
  );
}
