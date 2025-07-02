import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { comparisonImages } from '../../constants/ComparisonImages';
import { useState } from 'react';

export default function ImageBlurhash() {
  const image = comparisonImages[0];
  const [generatedSource, setGeneratedSource] = useState<{ blurhash: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Image:</Text>
      <Image
        source={image.source.uri}
        style={styles.image}
        onDisplay={async () => {
          const blurhash = await Image.generateBlurhashAsync(image.source.uri ?? '', [9, 9]);
          if (blurhash) {
            setGeneratedSource({
              blurhash: blurhash,
            });
          }
        }}
      />
      {generatedSource && (
        <>
          <Text style={styles.header}>Blurhash image:</Text>
          <Image source={generatedSource} style={styles.image} />
          <Text style={styles.header}>Blurhash:</Text>
          <Text style={styles.image}>{generatedSource.blurhash}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 10,
    fontWeight: 'bold',
  },
});
