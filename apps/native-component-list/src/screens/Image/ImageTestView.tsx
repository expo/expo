import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { ImageProps } from './types';

type PropsType = {
  imageProps: ImageProps;
  ImageComponent: React.ComponentType<any>;
};

export default class ImageTestView extends React.PureComponent<PropsType> {
  render() {
    const { imageProps, ImageComponent } = this.props;
    const { style, source, ...otherImageProps } = imageProps;
    return (
      <View style={styles.container}>
        <ImageComponent
          style={[styles.image, style]}
          source={source || require('../../../assets/images/exponent-icon.png')}
          resizeMode="cover"
          {...otherImageProps}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  image: {
    width: 200,
    height: 200,
  },
});
