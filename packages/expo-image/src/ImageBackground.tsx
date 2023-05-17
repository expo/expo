import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Image } from './Image';
import { ImageBackgroundProps } from './Image.types';

export class ImageBackground extends React.PureComponent<ImageBackgroundProps> {
  render() {
    const { style, imageStyle, children, ...props } = this.props;

    return (
      <View style={style}>
        <Image {...props} style={[StyleSheet.absoluteFill, imageStyle]} />
        {children}
      </View>
    );
  }
}
