import { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import domtoimage from 'dom-to-image';

import Button from './components/Button';
import ImageViewer from './components/ImageViewer';
import CircleButton from './components/CircleButton';
import IconButton from './components/IconButton';
import EmojiPicker from './components/EmojiPicker';
import EmojiList from './components/EmojiList';
import EmojiSticker from './components/EmojiSticker';

const SIZE = 40;
const PlaceholderImage = require('./assets/images/background-image.png');

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [showAppOptions, setShowAppOptions] = useState(false);
  const [pickedEmoji, setPickedEmoji] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [status, requestPermission] = MediaLibrary.usePermissions();
  const imageRef = useRef();

  if (status === null) {
    requestPermission();
  }

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
    setModalVisible(current => !current);
  };

  const saveImageHandler = async () => {
    if (Platform.OS !== 'web') {
      try {
        const localUri = await captureRef(imageRef, {
          height: 440,
          quality: 1,
        });
        await MediaLibrary.saveToLibraryAsync(localUri);
        if (localUri) {
          alert('Saved!');
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      domtoimage
        .toJpeg(imageRef.current)
        .then(dataUrl => {
          let link = document.createElement('a');
          link.download = 'my-saved-image.jpeg';
          link.href = dataUrl;
          link.click();
        })
        .catch(e => {
          console.log(e);
        });
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View ref={imageRef} style={styles.screenshotContainer} collapsable={false}>
        <ImageViewer
          ref={imageRef}
          placeholderImageSource={PlaceholderImage}
          selectedImage={selectedImage}
        />
        {pickedEmoji !== null ? (
          <EmojiSticker imageSize={SIZE} stickerSource={pickedEmoji} />
        ) : null}
      </View>
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
      <EmojiPicker modalVisible={modalVisible} onClose={modalVisibilityHandler}>
        <EmojiList onSelect={setPickedEmoji} />
      </EmojiPicker>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
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
    position: 'absolute',
    bottom: 80,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  screenshotContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
