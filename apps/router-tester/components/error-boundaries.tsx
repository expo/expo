import { Link, type ErrorBoundaryProps } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function createErrorBoundary(approach: string) {
  return function CustomErrorBoundary({ error, retry }: ErrorBoundaryProps) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          backgroundColor: 'rgb(255,80,80)',
        }}>
        <Text testID="custom-error-boundary">Custom {approach} error boundary</Text>
        <Text testID="custom-error-message">{error.message}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry"
          onPress={retry}
          style={{ backgroundColor: '#0b6caf', padding: 12 }}>
          <Text style={{ color: '#fff' }}>Retry</Text>
        </Pressable>
        <Link href="/error-boundaries">Back to error boundary examples</Link>
      </SafeAreaView>
    );
  };
}

export function ThrowingRoute() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Intentional production error boundary test');
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Throw error"
        onPress={() => setShouldThrow(true)}
        style={{ backgroundColor: '#b00020', padding: 12 }}>
        <Text style={{ color: '#fff' }}>Throw error</Text>
      </Pressable>
    </SafeAreaView>
  );
}
