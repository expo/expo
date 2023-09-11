import { Image } from 'expo-image';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

const GIF_SOURCES = [
  'https://media2.giphy.com/media/Q6WPVzFU8LcBWWgQE1/giphy.gif',
  'https://media3.giphy.com/media/cfuL5gqFDreXxkWQ4o/giphy.gif',
  'https://media3.giphy.com/media/l3q2AMoPRflHphYM8/giphy.gif',
  'https://media4.giphy.com/media/IXqRaInRqGMfK/giphy.gif',
  'https://media1.giphy.com/media/HMSLfCl5BsXoQ/giphy.gif',
  'https://media1.giphy.com/media/YRtLgsajXrz1FNJ6oy/giphy.gif',
  'https://media1.giphy.com/media/1HKaikaFqDt7i/giphy.gif',
  'https://media2.giphy.com/media/5tSvsYJl4T4fC/giphy.gif',
  'https://media1.giphy.com/media/5aCiXMnPl1cli/giphy.gif',
  'https://media1.giphy.com/media/rgAd7jWyJyo8M/giphy.gif',
  'https://media2.giphy.com/media/11quO2C07Sh2oM/giphy.gif',
  'https://media1.giphy.com/media/BTWVWzYoNyYzm/giphy.gif',
  'https://media4.giphy.com/media/12HZukMBlutpoQ/giphy.gif',
  'https://media1.giphy.com/media/13CoXDiaCcCoyk/giphy.gif',
  'https://media4.giphy.com/media/jTnGaiuxvvDNK/giphy.gif',
  'https://media1.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif',
  'https://media3.giphy.com/media/l0ExdMHUDKteztyfe/giphy.gif',
  'https://media4.giphy.com/media/5gXYzsVBmjIsw/giphy.gif',
];

const ITEMS_GAP = 12;
const COLUMNS_COUNT = 3;

const WINDOW_SIZE = Dimensions.get('window');
const IMAGE_SIZE = Math.ceil((WINDOW_SIZE.width - ITEMS_GAP * (COLUMNS_COUNT + 1)) / COLUMNS_COUNT);

function renderRow(_: any, row: number) {
  function renderImage(_: any, column: number) {
    const gifIndex = row * COLUMNS_COUNT + column;
    const uri = GIF_SOURCES[gifIndex];

    return <Image key={column} style={styles.image} source={uri} cachePolicy="none" />;
  }

  return (
    <View key={row} style={styles.row}>
      {Array(COLUMNS_COUNT).fill(0).map(renderImage)}
    </View>
  );
}

export default function ImageGifsScreen() {
  const rowsCount = Math.ceil(GIF_SOURCES.length / COLUMNS_COUNT);

  return <ScrollView>{Array(rowsCount).fill(0).map(renderRow)}</ScrollView>;
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: ITEMS_GAP,
    marginTop: ITEMS_GAP,
    paddingHorizontal: ITEMS_GAP,
  },
  image: {
    flex: 1,
    height: IMAGE_SIZE,
    borderRadius: 12,
  },
});
