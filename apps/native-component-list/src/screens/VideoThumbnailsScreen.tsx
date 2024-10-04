import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useState } from 'react';
import { StyleSheet, Button, View, Image, Text } from 'react-native';

export default function VideoThumbnailsScreen() {
  const [image, setImage] = useState<string | null>(null);

  const generateThumbnail = async (sourceFilename: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(sourceFilename, {
        time: 15000,
      });
      setImage(uri);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <View style={styles.container}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Text>{image}</Text>
      <Button
        onPress={() =>
          generateThumbnail('https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4')
        }
        title="Check Valid Source"
      />
      <Button
        onPress={() =>
          generateThumbnail('https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny2.mp4')
        }
        title="Check Invalid Source"
      />
      <Button onPress={() => generateThumbnail('invalid-url')} title="Check random text" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    rowGap: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  image: {
    width: 200,
    height: 200,
  },
});
