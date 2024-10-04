import { Image, ImageSource } from 'expo-image';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import { Colors } from '../../constants';

const generateSeed = () => 1 + Math.round(Math.random() * 10);

export default function ImagePlaceholderScreen() {
  const [source, setSource] = useState<ImageSource | null>(null);

  const loadAnyImage = useCallback(() => {
    setSource({ uri: getRandomImageUri() });
  }, [source]);

  const resetSource = useCallback(() => {
    setSource(null);
  }, [source]);

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={source ?? []}
        placeholder={require('../../../assets/images/expo-icon.png')}
        cachePolicy="none"
      />

      <View style={styles.actionsContainer}>
        <Text style={styles.text}>
          At first you should see only a placeholder{'\n'}
          as the source is not defined yet
        </Text>

        <Text style={styles.text}>
          Set one below and try it multiple times{'\n'}
          to confirm that the placeholder is not{'\n'}
          displayed when switching the sources{'\n'}
          👇
        </Text>
        <Button style={styles.actionButton} title="Set to a random source" onPress={loadAnyImage} />

        <Text style={styles.text}>
          Now reset it back to the placeholder{'\n'}
          👇
        </Text>
        <Button style={styles.actionButton} title="Reset the source" onPress={resetSource} />
      </View>
    </View>
  );
}

function getRandomImageUri(): string {
  return `https://picsum.photos/seed/${generateSeed()}/3000/2000`;
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
