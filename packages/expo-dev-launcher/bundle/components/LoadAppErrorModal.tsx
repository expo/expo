import { View, Text } from 'expo-dev-client-components';
import * as React from 'react';

export function LoadAppErrorModal({ message }) {
  return (
    <View>
      <Text>{message}</Text>
    </View>
  );
}
