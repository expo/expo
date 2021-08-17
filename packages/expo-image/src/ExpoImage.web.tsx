import React from 'react';
import { Image } from 'react-native';

import { ImageProps } from './Image';

export default function ExpoImage({ source, ...props }: ImageProps) {
  const resolvedSource = source ?? {};

  // @ts-expect-error - expo-image is being reworked so these types should be revisited
  return <Image {...props} source={resolvedSource} />;
}
