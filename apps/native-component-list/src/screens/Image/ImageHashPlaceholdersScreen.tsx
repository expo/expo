import { Image } from 'expo-image';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants';

// A blurhash of https://picsum.photos/seed/175/300/200 with 6x4 components
const blurhash = 'WgF}G?az0fs.x[jat7xFRjNHt6s.4;oe-:RkVtkCi^Nbo|xZRjWB';
const thumbhash = '1EgOHYQImHiZZ4iCe3eWeAinolA8';

export default function ImageHashPlaceholdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>BlurHash: </Text>
      <Image
        style={styles.image}
        source={{ uri: 'https://picsum.photos/seed/175/3000/2000' }}
        placeholder={{ blurhash, width: 18, height: 12 }}
        transition={1000}
        contentFit="cover"
        cachePolicy="none"
      />

      <Text style={styles.text}>ThumbHash: </Text>
      <Image
        style={styles.image}
        source={{ uri: 'https://picsum.photos/seed/175/3000/2000' }}
        placeholder={{ thumbhash }}
        transition={1000}
        contentFit="cover"
        cachePolicy="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  image: {
    height: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  text: {
    color: 'rgb(28,28,28)',
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
    fontWeight: '600',
  },
});
