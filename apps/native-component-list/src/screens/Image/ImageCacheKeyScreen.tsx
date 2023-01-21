import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import MonoText from '../../components/MonoText';
import { Colors } from '../../constants';

export default function ImagePlaceholderScreen() {
  const [uri, setUri] = useState<string>(getRandomImageUri());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadRandomImage = useCallback(() => {
    setIsLoading(true);
    setUri(getRandomImageUri());
  }, [uri]);

  const source = {
    uri,
    cacheKey: 'CUSTOM_CONSTANT_CACHE_KEY',
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={source}
        cachePolicy="disk"
        onLoad={({ cacheType }) => {
          if (cacheType === 'disk') {
            alert('Image was loaded from the disk cache');
          }
          setIsLoading(false);
        }}
      />

      <MonoText>{`const source = ${JSON.stringify(source, null, 2)}`}</MonoText>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.actionsContainer}>
        <Text style={styles.text}>
          At first let's make sure the disk cache is cleared{'\n'}
          👇
        </Text>

        <Button
          style={styles.actionButton}
          title="Clear disk cache"
          onPress={Image.clearDiskCache}
        />

        <Text style={styles.text}>
          Now load a new random source that{'\n'}
          uses the constant as a cache key.{'\n'}
          Do it multiple times and notice the image{'\n'}
          is not changing when the source changes{'\n'}
          👇
        </Text>

        <Button
          disabled={isLoading}
          style={styles.actionButton}
          title="Set random source uri"
          onPress={loadRandomImage}
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
