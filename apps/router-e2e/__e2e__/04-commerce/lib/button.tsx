'use client';

import { Text } from 'react-native';

export function Button({ onPress }) {
  return <Text onPress={() => onPress()}>Click</Text>;
}
