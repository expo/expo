import * as React from 'react';
import { View, Text } from 'react-native';

export function ErroredScreen({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Error: {message}</Text>
    </View>
  );
}

export function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch (error) {
    return () => <ErroredScreen message={error.message} />;
  }
}
