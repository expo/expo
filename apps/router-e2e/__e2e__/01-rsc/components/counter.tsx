/// <reference types="react/canary" />
'use client';

import { useState } from 'react';
import { Text } from 'react-native';

export const Counter = ({ onPress }) => {
  const [count, setCount] = useState(0);

  return (
    <Text
      onPress={async () => {
        onPress('1').then((value) => setCount(value.join(', ')));
      }}
      testID="client-button">
      Count: {count}
    </Text>
  );
};
