import React from 'react';
import { Image, requireNativeComponent } from 'react-native';

import { ImageProps } from './Image';

const NativeExpoImage = requireNativeComponent('ExpoImage');

export default function ExpoImage({ source, ...props }: ImageProps) {
  const resolvedSource = Image.resolveAssetSource(source ?? {});

  return <NativeExpoImage {...props} source={resolvedSource} />;
}
