import { Link, type ErrorBoundaryProps } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function createErrorBoundary(approach: string) {
  return function CustomErrorBoundary({ error, retry }: ErrorBoundaryProps) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
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
      </View>
    );
  };
}

export function ThrowingRoute() {
  throw new Error('Intentional production error boundary test');
}
