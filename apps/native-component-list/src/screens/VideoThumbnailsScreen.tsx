import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { NativeVideoThumbnail } from 'expo-video-thumbnails';
import React, { useState } from 'react';
import { StyleSheet, Button, Text, ScrollView } from 'react-native';

export default function VideoThumbnailsScreen() {
  const [nativeImage, setNativeImage] = useState<NativeVideoThumbnail | null>(null);
  const [cachedImage, setCachedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generateThumbnail = async (sourceFilename: string) => {
    setIsLoading(true);
    try {
      const image = await VideoThumbnails.getThumbnailAsync(sourceFilename, {
        time: 15000,
      });
      setCachedImage(image.uri);
    } catch (e) {
      console.warn('generateThumbnail', e);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNativeThumbnailAsync = async (sourceFilename: string) => {
    setIsLoading(true);
    try {
      const nativeImage = await VideoThumbnails.getNativeThumbnailAsync(sourceFilename, {
        time: 15000,
      });
      setNativeImage(nativeImage);
    } catch (e) {
      console.warn('generateThumbnailAsync', e);
    } finally {
      setIsLoading(false);
    }
  };

  const consoleLogThumbnailCache = async () => {
    const cache = await FileSystem.readDirectoryAsync(
      FileSystem.cacheDirectory + '/VideoThumbnails'
    );
    console.log(cache);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {isLoading && <Text>Loading...</Text>}
      {cachedImage && <Image source={{ uri: cachedImage }} style={styles.image} />}

      <Button
        onPress={() =>
          generateThumbnail(
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          )
        }
        title="Big Buck Bunny Source (generateThumbnail)"
      />
      <Button
        onPress={() =>
          generateThumbnail(
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          )
        }
        title="For Bigger Blazes Source (generateThumbnail)"
      />
      <Button
        onPress={() =>
          generateThumbnail('https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny2.mp4')
        }
        title="Check Invalid Source (generateThumbnail)"
      />
      <Button
        onPress={() => generateThumbnail('invalid-url')}
        title="Check random text (generateThumbnail)"
      />

      {nativeImage && <Image source={nativeImage} style={styles.image} />}
      <Button
        onPress={() =>
          generateNativeThumbnailAsync(
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          )
        }
        title="Big Buck Bunny Source (generateNativeThumbnailAsync)"
      />
      <Button
        onPress={() =>
          generateNativeThumbnailAsync(
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          )
        }
        title="For Bigger Blazes Source (generateNativeThumbnailAsync)"
      />
      <Button
        onPress={() =>
          generateNativeThumbnailAsync('https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny2.mp4')
        }
        title="Check Invalid Source (generateNativeThumbnailAsync)"
      />
      <Button
        onPress={() => generateNativeThumbnailAsync('invalid-url')}
        title="Check random text (generateNativeThumbnailAsync)"
      />

      <Button
        onPress={() => FileSystem.deleteAsync(`${FileSystem.cacheDirectory}/VideoThumbnails`)}
        title="Clear Cache"
      />
      <Button onPress={() => consoleLogThumbnailCache()} title="Log Cache" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  contentContainer: {
    rowGap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});
