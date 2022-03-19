import dedent from 'dedent';
import { Text } from 'expo-dev-client-components';
import * as React from 'react';

const NO_PUBLISHES_TEXT = dedent`
  This project has not yet been published.
`;

export function EmptySection() {
  return (
    <Text
      align="center"
      style={[
        {
          marginVertical: 16,
        },
      ]}
      type="InterRegular">
      {NO_PUBLISHES_TEXT}
    </Text>
  );
}
