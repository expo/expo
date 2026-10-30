import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';

const EXPO_SVG = require('../../../assets/images/expo.svg');

export default function ImageSvgLargeViewScreen() {
  const [isLarge, setIsLarge] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        On Android 8 and earlier, the 1080 × 3588 SVG exceeds the software drawing-cache limit. It
        should remain visible (rather than turning blank). Switch sizes to check that the small SVG
        still renders sharply after a layout change.
      </Text>
      <Button
        title={isLarge ? 'Show 200 × 200 SVG' : 'Show 1080 × 3588 SVG'}
        onPress={() => setIsLarge(!isLarge)}
      />
      <ScrollView style={styles.preview}>
        <Image
          source={EXPO_SVG}
          style={isLarge ? styles.largeImage : styles.smallImage}
          contentFit="fill"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    padding: 16,
  },
  preview: {
    marginTop: 16,
  },
  smallImage: {
    width: 200,
    height: 200,
  },
  largeImage: {
    width: 1080,
    height: 3588,
  },
});
