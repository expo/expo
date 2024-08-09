/// <reference types="react/canary" />
'use client';

import { useState } from 'react';
import { Text } from 'react-native';

export const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <Text onPress={() => setCount((c) => c + 1)} testID="client-button">
      Count: {count}
    </Text>
  );
};
