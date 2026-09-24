import type { Metadata } from 'expo-router/server';
import { Text } from 'react-native';

export function generateMetadata(): Metadata {
  return {
    other: {
      'expo-e2e-public-env-var-client': process.env.EXPO_PUBLIC_TEST_VALUE,
      'expo-e2e-private-env-var-client': process.env.EXPO_NOT_PUBLIC_TEST_VALUE,
    },
  };
}

export default function Page() {
  return (
    <Text testID="index-text" style={{ fontFamily: 'sweet' }}>
      Index
    </Text>
  );
}
