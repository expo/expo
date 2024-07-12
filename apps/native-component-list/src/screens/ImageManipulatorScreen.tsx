import Ionicons from '@expo/vector-icons/Ionicons';
import { Asset } from 'expo-asset';
import { ImageResult, FlipType, useImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import Colors from '../constants/Colors';

ImageManipulatorScreen.navigationOptions = {
  title: 'ImageManipulator',
};

const DEFAULT_IMAGE = Asset.fromModule(require('../../assets/images/example2.jpg'));

export default function ImageManipulatorScreen() {
  const [originalImageUri, setOriginalImageUri] = useState(DEFAULT_IMAGE.uri);
  const [image, setImage] = useState<Asset | ImageResult>(DEFAULT_IMAGE);
  const context = useImageManipulator(originalImageUri);

  useEffect(() => {
    refreshImage();
  }, [context]);

  const renderImage = () => {
    const height = image.height && image.height < 300 ? image.height : 300;
    const width = image.width && image.width < 300 ? image.width : 300;

    return (
      <View style={styles.imageContainer}>
        <Image source={{ uri: image.uri }} style={[styles.image, { height, width }]} />
      </View>
    );
  };

  async function refreshImage() {
    const image = await context.renderAsync();
    const result = await image.saveAsync({
      format: SaveFormat.PNG,
    });

    setImage(result);
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to MEDIA_LIBRARY not granted!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
    });
    if (result.canceled) {
      alert('No image selected!');
      return;
    }
    setOriginalImageUri(result.assets[0].uri);
  }

  function rotate(deg: number) {
    context.rotate(deg);
    refreshImage();
  }

  function resize(size: { width?: number; height?: number }) {
    context.resize(size);
    refreshImage();
  }

  function flip(flip: FlipType) {
    context.flip(flip);
    refreshImage();
  }

  async function compress(compress: number) {
    const image = await context.renderAsync();
    const saveResult = await image.saveAsync({ compress, format: SaveFormat.JPEG });

    setOriginalImageUri(saveResult.uri);
  }

  function crop() {
    context.crop({
      originX: 0,
      originY: 0,
      width: image.width! / 2,
      height: image.height! / 2,
    });
    refreshImage();
  }

  function combo() {
    context
      .rotate(180)
      .flip(FlipType.Vertical)
      .crop({
        originX: image.width! / 4,
        originY: image.height! / 4,
        width: image.width! / 2,
        height: image.width! / 2,
      });
    refreshImage();
  }

  function reset() {
    context.reset();
    setImage(DEFAULT_IMAGE);
    setOriginalImageUri(DEFAULT_IMAGE.uri);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ padding: 10 }}>
        <View style={styles.actionsButtons}>
          <Button style={styles.button} onPress={() => rotate(90)}>
            <Ionicons name="refresh" size={16} color="#ffffff" /> 90
          </Button>
          <Button style={styles.button} onPress={() => rotate(45)}>
            45
          </Button>
          <Button style={styles.button} onPress={() => rotate(-90)}>
            -90
          </Button>
          <Button style={styles.button} onPress={() => flip(FlipType.Horizontal)}>
            Flip horizontal
          </Button>
          <Button style={styles.button} onPress={() => flip(FlipType.Vertical)}>
            Flip vertical
          </Button>
          <Button style={styles.button} onPress={() => resize({ width: 250 })}>
            Resize width
          </Button>
          <Button style={styles.button} onPress={() => resize({ width: 300, height: 300 })}>
            Resize both to square
          </Button>
          <Button style={styles.button} onPress={() => compress(0.1)}>
            90% compression
          </Button>
          <Button style={styles.button} onPress={crop}>
            Crop - half image
          </Button>
          <Button style={styles.button} onPress={combo}>
            Cccombo
          </Button>
        </View>

        {renderImage()}
        <View style={styles.footerButtons}>
          <Button style={styles.button} onPress={pickPhoto}>
            Pick a photo
          </Button>
          <Button style={styles.button} onPress={reset}>
            Reset photo
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const Button: React.FunctionComponent<TouchableOpacityProps> = ({ onPress, style, children }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
    <Text style={styles.buttonText}>{children}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'contain',
  },
  button: {
    padding: 8,
    borderRadius: 3,
    backgroundColor: Colors.tintColor,
    marginRight: 10,
    marginBottom: 10,
  },
  actionsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
  },
});
