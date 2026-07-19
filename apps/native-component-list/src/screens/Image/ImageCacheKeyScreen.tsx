import { Image } from 'expo-image';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import MonoText from '../../components/MonoText';
import { Colors } from '../../constants';

const CACHE_KEY = 'CUSTOM_CONSTANT_CACHE_KEY';

export default function ImageCacheKeyScreen() {
  const [uri, setUri] = useState<string>(getRandomImageUri());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Set while seeding so the top view's `onLoad` reports where it loaded the seeded image from.
  const reportSeedResult = useRef<boolean>(false);

  const loadRandomImage = useCallback(() => {
    setIsLoading(true);
    setUri(getRandomImageUri());
  }, [uri]);

  const seedCache = useCallback(async () => {
    setIsLoading(true);
    // Start from an empty cache so the reload below has to go through the disk cache.
    await Image.clearDiskCache();
    await Image.clearMemoryCache();

    // Load a random image into memory and write it to the disk cache under the constant key.
    const randomUri = getRandomImageUri();
    const image = await Image.loadAsync({ uri: randomUri });
    await Image.writeToCacheAsync(image, CACHE_KEY);

    // Render the seeded image at the top via the cache key source and report how it loaded.
    reportSeedResult.current = true;
    setUri(randomUri);
  }, []);

  const source = {
    uri,
    cacheKey: CACHE_KEY,
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={source}
        cachePolicy="disk"
        onLoad={({ cacheType }) => {
          if (reportSeedResult.current) {
            reportSeedResult.current = false;
            alert(
              cacheType === 'disk' || cacheType === 'memory'
                ? `Seeded image was served from the ${cacheType} cache`
                : `Seeded image was not served from the cache (cacheType: ${cacheType})`
            );
          } else if (cacheType === 'disk') {
            alert('Image was loaded from the disk cache');
          }
          setIsLoading(false);
        }}
      />

      <MonoText>{`const source = ${JSON.stringify(source, null, 2)}`}</MonoText>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.actionsContainer}>
        <Text style={styles.text}>At first let's make sure the disk cache is cleared{'\n'}👇</Text>

        <Button
          style={styles.actionButton}
          title="Clear disk cache"
          onPress={Image.clearDiskCache}
        />

        <Text style={styles.text}>
          Now load a new random source that{'\n'}
          uses the constant as a cache key.{'\n'}
          Do it multiple times and notice the image{'\n'}
          is not changing when the source changes{'\n'}👇
        </Text>

        <Button
          disabled={isLoading}
          style={styles.actionButton}
          title="Set random source uri"
          onPress={loadRandomImage}
        />

        <Text style={styles.text}>
          You can also seed the cache yourself.{'\n'}
          This clears the cache, writes a random image{'\n'}
          to it under the constant key, renders it above,{'\n'}
          and reports where it was loaded from{'\n'}👇
        </Text>

        <Button
          disabled={isLoading}
          style={styles.actionButton}
          title="Seed cache"
          onPress={seedCache}
        />
      </ScrollView>
    </View>
  );
}

function getRandomImageUri(): string {
  const seed = 100 + Math.round(Math.random() * 100);
  return `https://picsum.photos/seed/${seed}/1200/800`;
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
  },
  scrollView: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionsContainer: {
    alignItems: 'center',
    padding: 10,
  },
  actionButton: {
    marginVertical: 15,
  },
  text: {
    marginTop: 15,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});
