'use client';

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Image } from './Image';
import { ImageBackgroundProps } from './Image.types';

export function ImageBackground({ style, imageStyle, children, ...props }: ImageBackgroundProps) {
  return (
    <View style={style}>
      <Image {...props} style={[StyleSheet.absoluteFill, imageStyle]} />
      {children}
    </View>
  );
}
