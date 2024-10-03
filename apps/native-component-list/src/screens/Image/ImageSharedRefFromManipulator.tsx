import type { SharedRef } from 'expo/types';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { FlipType, useImageManipulator } from 'expo-image-manipulator';
import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';

const DEFAULT_IMAGE = Asset.fromModule(require('../../../assets/images/example2.jpg'));

export default function ImageSharedRefFromManipulator() {
  const [image, setImage] = useState<SharedRef<'image'> | null>(null);
  const context = useImageManipulator(DEFAULT_IMAGE.uri);

  const transformImage = useCallback(async () => {
    const image = await context
      .crop({
        originX: DEFAULT_IMAGE.width! / 4,
        originY: DEFAULT_IMAGE.height! / 4,
        width: DEFAULT_IMAGE.width! / 2,
        height: DEFAULT_IMAGE.width! / 2,
      })
      .rotate(Math.random() * 360)
      .flip(FlipType.Vertical)
      .renderAsync();
    context.reset();

    setImage(image);
  }, [context]);

  return (
    <View style={styles.container}>
      <HeadingText>Original image:</HeadingText>
      <Image
        style={styles.image}
        source={{
          uri: DEFAULT_IMAGE.uri,
        }}
      />

      <Button style={styles.buttons} onPress={transformImage} title="Transform" />

      <Image style={styles.image} source={image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  image: {
    height: 200,
    borderRadius: 10,
  },
  buttons: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
