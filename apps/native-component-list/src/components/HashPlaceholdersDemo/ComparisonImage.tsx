import { Image, ImageSource } from 'expo-image';
import * as React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

type ComparisonImageProps = {
  source: ImageSource | null;
  placeholder?: ImageSource;
  showGrid?: boolean;
  transition?: number;
};

export default function ComparisonImage({
  source,
  placeholder,
  showGrid = false,
  transition = 2000,
}: ComparisonImageProps) {
  const image = (
    <Image
      style={styles.image}
      source={source}
      contentFit="cover"
      cachePolicy="none"
      placeholder={placeholder}
      transition={transition}
    />
  );
  // background is useful for showing grid on transparent views
  const background = showGrid ? require('../../../assets/images/transparencyGrid.png') : null;

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
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    height: 150,
    marginVertical: 5,
  },
});
