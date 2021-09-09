import ExpoImage from 'expo-image';
import React from 'react';
import { View, Text } from 'react-native';

import { ImageMethodResult } from './types';

export async function getImageMethodResult(
  method: Function,
  uri: string
): Promise<ImageMethodResult> {
  let message = '';
  const startTime = performance.now();
  if (method.name === 'prefetch') {
    message = await ExpoImage.prefetch(uri)
      .then(() => {
        return 'success';
      })
      .catch(() => {
        return 'failure';
      });
  }
  return {
    message,
    time: performance.now() - startTime,
  };
}

type PropsType = {
  methodResult: ImageMethodResult;
};

export function MethodResultView({ methodResult }: PropsType) {
  const message = methodResult.message;
  const time = methodResult.time;
  return message && time ? (
    <View>
      <Text>Method result: {message}</Text>
      <Text>Time: {time.toFixed(0)}ms</Text>
    </View>
  ) : null;
}
