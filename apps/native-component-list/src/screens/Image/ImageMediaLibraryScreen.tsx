import { Image, ImageSource } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import MonoText from '../../components/MonoText';
import { Colors } from '../../constants';

export default function ImagePlaceholderScreen() {
  const [source, setSource] = useState<ImageSource | null>(null);

  const pickImage = useCallback(async () => {
    const { assets } = await ImagePicker.launchImageLibraryAsync();
    const uri = assets?.[0].uri;

    if (uri) {
      setSource({ uri });
    } else {
      setSource(null);
    }
  }, []);

  const showRandomAsset = useCallback(async () => {
    const { assets } = await MediaLibrary.getAssetsAsync();
    const randomIndex = Math.floor(Math.random() * assets.length);
    const randomAsset = assets[randomIndex];

    if (randomAsset) {
      setSource({ uri: randomAsset.uri });
    } else {
      setSource(null);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={source}
        placeholder={require('../../../assets/images/expo-icon.png')}
        cachePolicy="none"
        onError={(event) => {
          alert(`Failed to load the image: ${event.error}`);
        }}
      />

      <View style={styles.actionsContainer}>
        <Text style={styles.text}>Integration with expo-image-picker</Text>
        <Button style={styles.actionButton} title="Launch image picker" onPress={pickImage} />

        <Text style={styles.text}>Integration with expo-media-library</Text>
        <Button
          style={styles.actionButton}
          title="Show random recent asset"
          onPress={showRandomAsset}
        />

        <Text style={styles.text}>Current source 👇</Text>
        <MonoText>{JSON.stringify(source, null, 2)}</MonoText>
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
    height: 220,
    borderWidth: 1,
    borderColor: Colors.border,
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
