import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, Platform, ScrollView, View, StyleSheet } from 'react-native';

import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';
import SimpleActionDemo from '../components/SimpleActionDemo';
import TitleSwitch from '../components/TitledSwitch';

async function requestCameraPermissionAsync() {
  // Image Picker doesn't need permissions in the web
  if (Platform.OS === 'web') {
    return true;
  }
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

async function requestMediaLibraryPermissionAsync() {
  // Image Picker doesn't need permissions in the web
  if (Platform.OS === 'web') {
    return true;
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

function ImagePickerScreen() {
  const [base64Enabled, setB64Enabled] = React.useState(false);
  const [selection, setSelection] = React.useState<ImagePicker.ImagePickerResult | undefined>(
    undefined
  );
  const [compressionEnabled, setCompressionEnabled] = React.useState(false);

  const showCamera = async (mediaTypes: ImagePicker.MediaTypeOptions, allowsEditing = false) => {
    await requestCameraPermissionAsync();
    const time = Date.now();
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes,
      allowsEditing,
      quality: compressionEnabled ? 0.1 : 1.0,
      base64: base64Enabled,
    });
    console.log(`Duration: ${Date.now() - time}ms`);
    console.log(`Results:`, result);
    if (result.cancelled) {
      setSelection(undefined);
    } else {
      setSelection(result);
    }
  };

  const showPicker = async (mediaTypes: ImagePicker.MediaTypeOptions, allowsEditing = false) => {
    await requestMediaLibraryPermissionAsync();
    const time = Date.now();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing,
      base64: base64Enabled,
      quality: compressionEnabled ? 0.1 : 1.0,
    });
    console.log(`Duration: ${Date.now() - time}ms`);
    console.log(`Results:`, result);
    if (result.cancelled) {
      setSelection(undefined);
    } else {
      setSelection(result);
    }
  };
  const renderSelection = () => {
    if (!selection || selection.cancelled) {
      return;
    }

    if (selection.base64) {
      selection.base64 = `${selection.base64.substring(0, 150)}...`;
    }

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.previewContainer}>
          {selection.type === 'video' ? (
            <Video
              source={{ uri: selection.uri }}
              style={styles.video}
              resizeMode="contain"
              shouldPlay
              isLooping
            />
          ) : (
            <Image source={{ uri: selection.uri }} style={styles.image} />
          )}
        </View>
        <MonoText>{JSON.stringify(selection, null, 2)}</MonoText>
      </View>
    );
  };

  return (
    <ScrollView style={styles.mainContainer}>
      <SimpleActionDemo
        title="requestMediaLibraryPermissionsAsync"
        action={() => ImagePicker.requestMediaLibraryPermissionsAsync()}
      />
      <SimpleActionDemo
        title="getMediaLibraryPermissionsAsync"
        action={() => ImagePicker.getMediaLibraryPermissionsAsync()}
      />
      <SimpleActionDemo
        title="requestCameraPermissionsAsync"
        action={() => ImagePicker.requestCameraPermissionsAsync()}
      />
      <SimpleActionDemo
        title="getCameraPermissionsAsync"
        action={() => ImagePicker.getCameraPermissionsAsync()}
      />

      <TitleSwitch
        style={{ marginVertical: 8, marginTop: 20 }}
        title="With base64"
        setValue={(value) => setB64Enabled(value)}
        value={base64Enabled}
      />
      <TitleSwitch
        style={{ marginVertical: 8 }}
        title="Compression"
        setValue={(value) => setCompressionEnabled(value)}
        value={compressionEnabled}
      />

      <ListButton
        onPress={() => showCamera(ImagePicker.MediaTypeOptions.All)}
        title="Take photo or video"
      />
      <ListButton
        onPress={() => showCamera(ImagePicker.MediaTypeOptions.Images)}
        title="Take photo"
      />
      <ListButton
        onPress={() => showCamera(ImagePicker.MediaTypeOptions.Videos)}
        title="Take video"
      />
      <ListButton
        onPress={() => showCamera(ImagePicker.MediaTypeOptions.All, true)}
        title="Open camera and edit"
      />
      <ListButton
        onPress={() => showPicker(ImagePicker.MediaTypeOptions.All)}
        title="Pick photo or video"
      />
      <ListButton
        onPress={() => showPicker(ImagePicker.MediaTypeOptions.Images)}
        title="Pick photo"
      />
      <ListButton
        onPress={() => showPicker(ImagePicker.MediaTypeOptions.Videos)}
        title="Pick video"
      />
      <ListButton
        onPress={() => showPicker(ImagePicker.MediaTypeOptions.Images, true)}
        title="Pick photo and edit"
      />

      {renderSelection()}
    </ScrollView>
  );
}

ImagePickerScreen.navigationOptions = {
  title: 'ImagePicker',
};

const styles = StyleSheet.create({
  mainContainer: {
    padding: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 30,
    marginBottom: 10,
  },
  switch: {
    marginHorizontal: 10,
  },
  text: {
    fontSize: 12,
  },
  previewContainer: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#000000',
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  video: {
    width: 300,
    height: 300,
  },
  detailsContainer: {
    marginVertical: 16,
  },
});

export default ImagePickerScreen;
