'use server';

import Entypo from '@expo/vector-icons/Entypo';
import { Image, Text } from 'react-native';

export async function renderPageTwo(params: { title: string }) {
  return (
    <>
      <Text testID="second-text">Secondary</Text>

      <Image
        testID="main-image"
        source={require('../../../assets/icon.png')}
        style={{ width: 100, height: 100 }}
      />

      <Entypo name="twitter" />
    </>
  );
}
