import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';

const DETAIL_SUITES = ['Default', 'Minimal', 'Custom'] as const;

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [configSuite, setConfigSuite] = useState(0);
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        gap: 8,
      }}>
      {configSuite === 0 && (
        <>
          <Stack.Screen.Title>{id}</Stack.Screen.Title>
          <Stack.Screen.BackButton>Go back</Stack.Screen.BackButton>
          <Stack.Header blurEffect="regular" />
        </>
      )}
      {configSuite === 1 && (
        <>
          <Stack.Screen.Title>Detail: {id}</Stack.Screen.Title>
          <Stack.Header blurEffect="prominent" />
        </>
      )}
      {configSuite === 2 && (
        <>
          <Stack.Screen.Title>{id}</Stack.Screen.Title>
          <Stack.Screen.BackButton>Return</Stack.Screen.BackButton>
        </>
      )}
      <Text testID="detail-render-count">Renders: {renderCount.current}</Text>
      <Button
        testID="detail-cycle-config"
        title={`Config: ${DETAIL_SUITES[configSuite]} (tap to cycle)`}
        onPress={() => setConfigSuite((s) => (s + 1) % DETAIL_SUITES.length)}
      />
      <Link href={`/composition-rerenders/${Number(id) + 1}`}>Go to {Number(id) + 1}</Link>
    </View>
  );
}
