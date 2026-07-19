import { StyleSheet, View, ViewStyle } from 'react-native';

import { defaultImage } from './images';
import { ImageTestComponent, ImageTestProps } from './types';

export default function ImageTestView({
  imageProps,
  ImageComponent,
  loadOnDemand,
  ...props
}: {
  style?: ViewStyle;
  imageProps: ImageTestProps;
  ImageComponent: ImageTestComponent;
  loadOnDemand?: boolean;
}) {
  const { style, source, ...otherImageProps } = imageProps;
  return (
    <View style={styles.container}>
      <ImageComponent
        style={[styles.image, props.style, style]}
        source={source && !loadOnDemand ? source : defaultImage}
        {...otherImageProps}
      />
    </View>
  );
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
