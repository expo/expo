import ExpoImage from 'expo-image';

import { ImageMethodNames, ImageMethodResult } from './types';

export async function getImageMethodResult(
  methodName: ImageMethodNames,
  uri: string
): Promise<ImageMethodResult> {
  let result = '';
  const time = 0; // TODO: measure time
  if (methodName === ImageMethodNames.Prefetch) {
    result = await ExpoImage.prefetch(uri)
      .then(() => {
        return 'succes';
      })
      .catch(() => {
        return 'failure';
      });
  }
  return {
    result,
    time,
  };
}
