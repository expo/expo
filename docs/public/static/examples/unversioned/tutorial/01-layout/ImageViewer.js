import { StyleSheet, View, Image } from 'react-native';

export default function ImageViewer({ placeholderImageSource }) {
  return (
    <View style={styles.imageContainer}>
      <Image source={placeholderImageSource} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    paddingTop: 58,
    backgroundColor: 'transparent',
  },
  image: {
    width: 320,
    height: 440,
    borderRadius: 18,
  },
});
