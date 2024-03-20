import dedent from 'dedent';
import { Text, View } from 'expo-dev-client-components';
import * as React from 'react';

const NO_PUBLISHES_TEXT = dedent`
This project has not yet been published.
`;

export function EmptySection() {
  return (
    <View bg="default" border="default" rounded="medium" padding="medium">
      <Text type="InterRegular">{NO_PUBLISHES_TEXT}</Text>
    </View>
  );
}
