import { ImageSource } from 'expo-image';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import ComparisonImage from './ComparisonImage';

type ComparisonRowProps = {
  source: ImageSource;
  blurhash: ImageSource;
  thumbhash: string;
  showRealImage?: boolean;
  showGrid?: boolean;
};

export default function ComparisonRow({
  source,
  blurhash,
  thumbhash,
  showRealImage = false,
  showGrid = false,
}: ComparisonRowProps) {
  return (
    <View style={styles.rowContainer}>
      <ComparisonImage source={source} showGrid={showGrid} />
      <ComparisonImage
        source={showRealImage ? source : blurhash}
        showGrid={showGrid}
        backgroundImage={source}
      />
      <ComparisonImage
        source={showRealImage ? source : { thumbhash }}
        showGrid={showGrid}
        backgroundImage={source}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
