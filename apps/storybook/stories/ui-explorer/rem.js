import { Dimensions, Platform, PixelRatio } from 'react-native';

const fontSize = 12;

export default function normalize(size) {
  if (Platform.OS === 'web') return size + 'rem';

  return fontSize * size;
}
