import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';

export default function ImageBlurhash() {
  const uri = 'https://picsum.photos/seed/175/300/200';
  const [generatedSource, setGeneratedSource] = useState<{ blurhash: string }>();

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={styles.header}>Image:</Text>
        <Image
          source={uri}
          style={styles.image}
          onDisplay={async () => {
            const blurhash = await Image.generateBlurhashAsync(uri ?? '', [9, 9]);
            if (blurhash) {
              setGeneratedSource({
                blurhash: blurhash,
              });
            }
          }}
        />
      </View>
      <View style={{ flex: 2 }}>
        {generatedSource ? (
          <>
            <View style={{ flex: 1 }}>
              <Text style={styles.header}>Blurhash image:</Text>
              <Image source={generatedSource} style={styles.image} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.header}>Blurhash:</Text>
              <Text style={styles.image}>{generatedSource.blurhash}</Text>
            </View>
          </>
        ) : (
          <Text>Loading</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  image: {
    flex: 1,
  },
  header: {
    marginTop: 10,
    fontWeight: 'bold',
  },
});
