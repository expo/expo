import { Image } from 'expo-image';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

const DATA: number[] = Array(1000).fill(0);
const WINDOW_SIZE = Dimensions.get('window');
const COLUMNS_COUNT = 4;
const IMAGE_SIZE = Math.ceil(WINDOW_SIZE.width / COLUMNS_COUNT);
const IMAGE_PIXEL_SIZE = Math.ceil(IMAGE_SIZE * WINDOW_SIZE.scale);

function renderItem(index: number) {
  function renderImage(_: any, column: number) {
    // The uri has an offset because the first images are almost the same, it doesn't look well.
    const uri = `https://picsum.photos/id/${10 + index + column * COLUMNS_COUNT}/${IMAGE_PIXEL_SIZE}`;

    return <Image key={column} style={styles.image} source={{ uri }} loading="lazy" />;
  }

  return <View style={styles.row}>{Array(COLUMNS_COUNT).fill(0).map(renderImage)}</View>;
}

export default function ImageLazyLoadingScreen() {
  return (
    <View style={styles.root}>
      <ScrollView>{DATA.map((_, index) => renderItem(index))}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    flex: 1,
    flexBasis: 0,
    flexShrink: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
});
