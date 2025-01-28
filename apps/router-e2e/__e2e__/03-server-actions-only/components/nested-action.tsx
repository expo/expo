'use server';

import { Text } from 'react-native';

export async function renderNestedAsync() {
  return (
    <Text
      testID="nested-text"
      style={{
        backgroundColor: 'darkcyan',
      }}>
      Platform: {process.env.EXPO_OS}
    </Text>
  );
}
