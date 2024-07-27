import { Image, ImageRef } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

function getRandomImageUri(): string {
  const seed = 1 + Math.round(Math.random() * 2137);
  return `https://picsum.photos/seed/${seed}/3000/2000`;
}

// Shared objects' properties are defined in the prototype, thus they're not picked by `JSON.stringify`.
// In this screen we show the contents of the image object, so `toJSON` needs to be overriden to include prototype's properties.
// TODO: We may want to override this globally for all shared objects. Keep it here for now until we decide what to do.
// @ts-expect-error
Image.Image.prototype.toJSON = function () {
  const json: Record<string, any> = {};

  for (const key in this) {
    if (typeof (this as any)[key] !== 'function') {
      json[key] = (this as any)[key];
    }
  }
  return json;
};

export default function ImageSharedRefScreen() {
  const [imageRef, setImageRef] = useState<ImageRef | null>(null);
  const [sourceUri, setSourceUri] = useState<string>(getRandomImageUri());

  useEffect(() => {
    setImageRef(null);

    Image.loadAsync({ uri: sourceUri }).then((image) => {
      setImageRef(image);
    });
  }, [sourceUri]);

  const loadNewImage = useCallback(() => {
    setSourceUri(getRandomImageUri());
  }, []);

  return (
    <View style={styles.container}>
      <Image style={styles.image} source={imageRef} />

      <HeadingText>Loaded image:</HeadingText>
      <MonoText>{JSON.stringify(imageRef, null, 2)}</MonoText>

      <View style={styles.buttons}>
        <Button title="Load new image" onPress={loadNewImage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  image: {
    height: 300,
    borderRadius: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
