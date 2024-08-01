import { BarcodeScanningResult, Camera } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';

export default function CameraScreenFromURL() {
  const [image, setImage] = useState<string | null>(null);
  const [results, setResults] = useState<BarcodeScanningResult[] | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const scanImage = async () => {
    if (!image) {
      return;
    }
    const results = await Camera.scanFromURLAsync(image);
    setResults(results);
  };

  return (
    <View style={styles.container}>
      {!image && <Text>Select an image from the photo library</Text>}
      <Button title="Select image" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {image && <Button title="Scan Image" onPress={scanImage} />}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scollViewContent}>
        {results && <Text>{JSON.stringify(results, null, 2)}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 20,
  },
  image: {
    width: 200,
    height: 200,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scollViewContent: {
    padding: 20,
    alignItems: 'center',
  },
});
