import { Pressable, Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';

export default function () {
  return (
    <>
      <Text testID="e2e-screen">{JSON.stringify(useLocalSearchParams())}</Text>
      <Text testID="e2e-can-back">{router.canGoBack()}</Text>
      <Pressable onPress={() => router.navigate('/three/banana')}>
        <Text>Navigate banana</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/three/banana')}>
        <Text>Push banana</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/three/banana')}>
        <Text>Replace banana</Text>
      </Pressable>
    </>
  );
}
