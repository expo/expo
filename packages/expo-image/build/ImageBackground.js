'use client';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from './Image';
export function ImageBackground({ style, imageStyle, children, ...props }) {
    return (<View style={style}>
      <Image {...props} style={[StyleSheet.absoluteFill, imageStyle]}/>
      {children}
    </View>);
}
//# sourceMappingURL=ImageBackground.js.map