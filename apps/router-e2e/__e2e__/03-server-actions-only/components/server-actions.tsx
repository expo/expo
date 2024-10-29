'use server';

import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Text } from 'react-native';

export async function renderPage(params: { title: string }) {
  return (
    <>
      <Text testID="index-text">Platform: {process.env.EXPO_OS}</Text>
      <Text testID="secret-text">Secret: {process.env.TEST_SECRET_VALUE}</Text>
      <Text>Render: {Date.now()}</Text>

      <Image
        testID="main-image"
        source={require('../../../assets/icon.png')}
        style={{ width: 100, height: 100 }}
      />

      <Ionicons name="airplane" />
      <Text testID="server-contents">{params.title}</Text>
    </>
  );
}
