import { Image, ImageSource } from 'expo-image';
import * as React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { Colors } from '../../constants';

type ComparisonImageProps = {
  source: ImageSource;
  placeholder?: ImageSource;
  showGrid?: boolean;
  backgroundImage?: ImageSource | null;
};

export default function ComparisonImage({
  source,
  placeholder,
  showGrid = false,
  backgroundImage,
}: ComparisonImageProps) {
  const image = (
    <Image
      style={styles.image}
      source={source}
      contentFit="cover"
      cachePolicy="none"
      placeholder={placeholder}
      transition={2000}
    />
  );
  // background is useful for showing grid on transparent views or avoiding images becoming brighter during transition
  const background = showGrid
    ? require('../../../assets/images/transparencyGrid.png')
    : backgroundImage;

  return background ? (
    <ImageBackground source={background} style={styles.imageContainer}>
      {image}
    </ImageBackground>
  ) : (
    <View style={styles.imageContainer}>{image}</View>
  );
}
const styles = StyleSheet.create({
  image: {
    width: 110,
    height: 150,
  },
  imageContainer: {
    width: 110,
    height: 150,
    margin: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
