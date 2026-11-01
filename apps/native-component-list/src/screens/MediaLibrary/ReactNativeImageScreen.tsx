import { Image as ExpoImage } from 'expo-image';
import { AssetField, MediaType, Query, requestPermissionsAsync } from 'expo-media-library';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import MonoText from '../../components/MonoText';

export default function ReactNativeImageScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const [status, setStatus] = useState('Load a photo to test React Native Image.');
  const [loading, setLoading] = useState(false);

  const loadPhoto = async () => {
    setLoading(true);
    setUri(null);
    setStatus('Loading…');
    try {
      const permission = await requestPermissionsAsync();
      if (!permission.granted) {
        setStatus('Allow access to photos, then try again.');
        return;
      }
      const [asset] = await new Query().eq(AssetField.MEDIA_TYPE, MediaType.IMAGE).limit(1).exe();
      if (!asset) {
        setStatus('No accessible photos. Add a photo to the library, then try again.');
        return;
      }
      setUri(asset.id);
    } catch (error) {
      setStatus(`Could not load a photo: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Both images should display the same photo directly from its ph:// asset ID.</Text>
      <Button title="Load photo from library" onPress={loadPhoto} loading={loading} />
      <Text testID="media-library-rn-image-status">React Native Image: {status}</Text>
      {uri && (
        <>
          <MonoText>{uri}</MonoText>
          <View>
            <Text>React Native Image</Text>
            <Image
              testID="media-library-rn-image"
              source={{ uri }}
              style={styles.image}
              resizeMode="contain"
              onLoad={() => setStatus('Loaded')}
              onError={({ nativeEvent }) => setStatus(`Failed: ${nativeEvent.error}`)}
            />
          </View>
          <View>
            <Text>expo-image</Text>
            <ExpoImage source={{ uri }} style={styles.image} contentFit="contain" />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  image: {
    width: '100%',
    height: 200,
  },
});
