import * as React from 'react';
import { View, Text } from 'react-native';

import { ScreenConfig } from '../types/ScreenConfig';

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

export function routeFilterForE2e(route: ScreenConfig) {
  if (process.env.CI || process.env.EXPO_PUBLIC_E2E) {
    return 'e2e' in route && !!route.e2e;
  }
  return true;
}
