import React from 'react';
import { Image, ImageProps, ImageStyle } from 'expo-image';

export const PreviewImage = (props: ImageProps) => {
  const { style: $styleOverride, ...rest } = props;
  return (
    <Image
      accessible
      accessibilityRole="image"
      style={[$previewSource, $styleOverride]}
      {...rest}
    />
  );
};

const $previewSource: ImageStyle = {
  width: '100%',
  height: '100%',
};
