import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import Button from './components/Button';
import ImageViewer from './components/ImageViewer';
import CircleButton from './components/CircleButton';
import IconButton from './components/IconButton';

const PlaceholderImage = require('./assets/images/background-image.png');

export default function App() {
  const [showAppOptions, setShowAppOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImageHandler = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setSelectedImage(result.uri);
      setShowAppOptions(true);
    } else {
      alert('You did not select any image.');
    }
  };

  const resetHandler = () => {
    setShowAppOptions(false);
  };

  const modalVisibilityHandler = () => {
    // we will implement this later
  };

  const saveImageHandler = () => {
    // we will implement this later
  };

  return (
    <View style={styles.container}>
      <ImageViewer placeholderImageSource={PlaceholderImage} selectedImage={selectedImage} />
      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPressHandler={resetHandler} />
            <CircleButton onPressHandler={modalVisibilityHandler} />
            <IconButton icon="save-alt" label="Save" onPressHandler={saveImageHandler} />
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button label="Choose a photo" onPressHandler={pickImageHandler} />
          <Button
            label="Use this photo"
            isBorderLess
            onPressHandler={() => setShowAppOptions(true)}
          />
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },
  optionsContainer: {
    flex: 1 / 4,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
