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
  } catch (error: any) {
    return () => <ErroredScreen message={error.message} />;
  }
}

/**
 * Loads a group of screens, or none when its module cannot be loaded, for example because it
 * imports a native module that is not available on the current platform.
 */
export function optionalScreens<T>(requirer: () => T[]): T[] {
  try {
    return requirer();
  } catch (error: any) {
    console.warn(`Skipping a screen group that failed to load: ${error.message}`);
    return [];
  }
}
