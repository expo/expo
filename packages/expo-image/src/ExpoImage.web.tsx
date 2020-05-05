import React from 'react';
import { Image } from 'react-native';

import { ImageProps } from './Image';

export default function ExpoImage({ source, ...props }: ImageProps) {
  const resolvedSource = source ?? {};

  return <Image {...props} source={resolvedSource} />;
}
