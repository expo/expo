import { ImageBackground } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants';

export default function ImageBackgroundScreen() {
  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.imageContainer}
        imageStyle={styles.image}
        source={require('../../../assets/images/highres.jpeg')}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>Renders on top of image</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  imageContainer: {
    borderWidth: 1,
    height: 200,
    borderColor: Colors.border,
    padding: 20,
    gap: 10,
  },
  image: {},
  textContainer: {
    backgroundColor: 'black',
    padding: 5,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
});
