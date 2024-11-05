'use server';

import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { unstable_headers } from 'expo-router/rsc/headers';

export async function renderPage(params: { title: string }) {
  const platformHeader = (await unstable_headers()).get('expo-platform');
  return (
    <>
      <Stack.Screen options={{ title: 'Server Actions' }} />
      <Text testID="index-text">Platform: {process.env.EXPO_OS}</Text>
      <Text testID="secret-text">Secret: {process.env.TEST_SECRET_VALUE}</Text>
      <Text>Render: {Date.now()}</Text>
      <Text testID="platform-header">Header: {platformHeader}</Text>

      <Image
        testID="main-image"
        source={require('../../../assets/icon.png')}
        style={{ width: 100, height: 100 }}
      />

      <Ionicons name="airplane" />
      <Text testID="server-contents">{params.title}</Text>
      <Link href="/second">Second</Link>
    </>
  );
}
