import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const DATA: number[] = Array(1000).fill(0);

function renderItem({ index }: ListRenderItemInfo<number>) {
  function renderImage(_: any, column: number) {
    return (
      <Image
        key={column}
        style={styles.image}
        source={{ uri: `https://source.unsplash.com/random/${index + column}` }}
      />
    );
  }
  return <View style={styles.row}>{Array(4).fill(0).map(renderImage)}</View>;
}

export default function ImageFlashListScreen() {
  return <FlashList data={DATA} renderItem={renderItem} estimatedItemSize={100} />;
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  image: {
    width: 100,
    height: 100,
  },
});
