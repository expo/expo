import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import React from 'react';
import { Image, Platform, ScrollView, View, Text, Switch, StyleSheet } from 'react-native';

import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';
import TitleSwitch from '../components/TitledSwitch';

async function requestPermissionAsync(permission: Permissions.PermissionType) {
  // Image Picker doesn't need permissions in the web
  if (Platform.OS === 'web') {
    return true;
  }
  const { status } = await Permissions.askAsync(permission);
  return status === 'granted';
}

interface State {
  selection?: ImagePicker.ImagePickerResult;
  base64Enabled: boolean;
  compressionEnabled: boolean;
}

export default class ImagePickerScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'ImagePicker',
  };

  readonly state: State = {
    base64Enabled: false,
    compressionEnabled: false,
  };

  showCamera = async (mediaTypes: ImagePicker.MediaTypeOptions, allowsEditing = false) => {
    await requestPermissionAsync(Permissions.CAMERA);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes,
      allowsEditing,
      quality: this.state.compressionEnabled ? 0.1 : 1.0,
      base64: this.state.base64Enabled,
    });
    if (result.cancelled) {
      this.setState({ selection: undefined });
    } else {
      this.setState({ selection: result });
    }
  };

  showPicker = async (mediaTypes: ImagePicker.MediaTypeOptions, allowsEditing = false) => {
    await requestPermissionAsync(Permissions.CAMERA_ROLL);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing,
      base64: this.state.base64Enabled,
      quality: this.state.compressionEnabled ? 0.1 : 1.0,
    });
    if (result.cancelled) {
      this.setState({ selection: undefined });
    } else {
      this.setState({ selection: result });
    }
  };
  render() {
    return (
      <ScrollView style={styles.mainContainer}>
        <TitleSwitch
          style={{ marginVertical: 8 }}
          title="With base64"
          setValue={value => this.setState({ base64Enabled: value })}
          value={this.state.base64Enabled}
        />
        <TitleSwitch
          style={{ marginVertical: 8 }}
          title="Compression"
          setValue={value => this.setState({ compressionEnabled: value })}
          value={this.state.compressionEnabled}
        />

        <ListButton
          onPress={() => this.showCamera(ImagePicker.MediaTypeOptions.All)}
          title="Take photo or video"
        />
        <ListButton
          onPress={() => this.showCamera(ImagePicker.MediaTypeOptions.Images)}
          title="Take photo"
        />
        <ListButton
          onPress={() => this.showCamera(ImagePicker.MediaTypeOptions.Videos)}
          title="Take video"
        />
        <ListButton
          onPress={() => this.showCamera(ImagePicker.MediaTypeOptions.All, true)}
          title="Open camera and edit"
        />
        <ListButton
          onPress={() => this.showPicker(ImagePicker.MediaTypeOptions.All)}
          title="Pick photo or video"
        />
        <ListButton
          onPress={() => this.showPicker(ImagePicker.MediaTypeOptions.Images)}
          title="Pick photo"
        />
        <ListButton
          onPress={() => this.showPicker(ImagePicker.MediaTypeOptions.Videos)}
          title="Pick video"
        />
        <ListButton
          onPress={() => this.showPicker(ImagePicker.MediaTypeOptions.Images, true)}
          title="Pick photo and edit"
        />

        {this._maybeRenderSelection()}
      </ScrollView>
    );
  }

  _maybeRenderSelection = () => {
    const { selection } = this.state;

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
}

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
