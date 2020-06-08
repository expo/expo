import * as React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { defaultImage } from './images';
import { ImageProps } from './types';

type PropsType = {
  style?: ViewStyle;
  imageProps: ImageProps;
  ImageComponent: React.ComponentType<any>;
};

export default class ImageTestView extends React.PureComponent<PropsType> {
  render() {
    const { imageProps, ImageComponent } = this.props;
    const { style, defaultStyle, source, ...otherImageProps } = imageProps;
    return (
      <View style={styles.container}>
        <ImageComponent
          style={[defaultStyle || styles.image, defaultStyle ? undefined : this.props.style, style]}
          source={source || defaultImage}
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
