import { Image, useImage } from 'expo-image';
import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

function getRandomImageUri(): string {
  const seed = 1 + Math.round(Math.random() * 2137);
  return `https://picsum.photos/seed/${seed}/3000/2000`;
}

export default function ImageSharedRefScreen() {
  const [sourceUri, setSourceUri] = useState<string>(getRandomImageUri());
  const image = useImage(sourceUri, {
    onError(error, retry) {
      console.error(error);
    },
  });

  const loadNewImage = useCallback(() => {
    setSourceUri(getRandomImageUri());
  }, []);

  return (
    <View style={styles.container}>
      <Image style={styles.image} source={image} />

      <View style={styles.buttons}>
        <Button title="Load new image" onPress={loadNewImage} />
      </View>

      <HeadingText>Loaded image:</HeadingText>
      <MonoText>{JSON.stringify(image, null, 2)}</MonoText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  image: {
    height: 240,
    margin: 10,
    borderRadius: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
