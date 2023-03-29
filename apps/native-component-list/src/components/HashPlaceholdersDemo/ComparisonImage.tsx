import { Image, ImageSource } from 'expo-image';
import * as React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { Colors } from '../../constants';

type ComparisonImageProps = {
  source: ImageSource;
  placeholder?: ImageSource;
  showGrid?: boolean;
};

export default function ComparisonImage({
  source,
  placeholder,
  showGrid = false,
}: ComparisonImageProps) {
  const image = (
    <Image
      style={styles.image}
      source={source}
      contentFit="cover"
      cachePolicy="disk"
      placeholder={placeholder}
      transition={2000}
    />
  );

  return showGrid ? (
    <ImageBackground
      source={{
        uri: 'https://lpc.opengameart.org/sites/default/files/Transparency500.png',
      }}
      style={styles.imageContainer}>
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
