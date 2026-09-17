import type { SuspenseFallbackProps } from 'expo-router';
import { use } from 'react';
import { Text, View } from 'react-native';

const pending = new Map<string, Promise<string>>();

/** Resolves once per key so the same promise is reused across renders while it is pending. */
function loadData(key: string, delayMs: number) {
  let promise = pending.get(key);
  if (!promise) {
    promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve(`Loaded ${key}`), delayMs);
    });
    pending.set(key, promise);
  }
  return promise;
}

export function createFallback(testID: string) {
  return function Fallback({ route, params }: SuspenseFallbackProps) {
    return (
      <View style={{ padding: 16, gap: 8 }}>
        <Text testID={testID}>Loading {route}</Text>
        <Text testID={`${testID}-params`}>{JSON.stringify(params)}</Text>
      </View>
    );
  };
}

/** A screen that suspends on data for `delayMs` after its module has loaded. */
export function createSuspendingScreen(key: string, delayMs = 1500) {
  return function SuspendingScreen() {
    const value = use(loadData(key, delayMs));
    return (
      <View style={{ padding: 16 }}>
        <Text testID={`${key}-content`}>{value}</Text>
      </View>
    );
  };
}
