import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import React from 'react';
import { Image, Platform, ScrollView, View } from 'react-native';

import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';

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
}

export default class ImagePickerScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'ImagePicker',
  };

  readonly state: State = {};

  showCamera = async (mediaTypes: ImagePicker.MediaTypeOptions, allowsEditing = false) => {
    await requestPermissionAsync(Permissions.CAMERA);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes,
      allowsEditing,
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
    });
    if (result.cancelled) {
      this.setState({ selection: undefined });
    } else {
      this.setState({ selection: result });
    }
  };
  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
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
          onPress={() => this.showPicker(ImagePicker.MediaTypeOptions.All, true)}
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

    return (
      <View style={{ marginVertical: 16 }}>
        <View
          style={{
            marginBottom: 10,
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            backgroundColor: '#000000',
          }}>
          {selection.type === 'video' ? (
            <Video
              source={{ uri: selection.uri }}
              style={{ width: 300, height: 300 }}
              resizeMode="contain"
              shouldPlay
              isLooping
            />
          ) : (
            <Image
              source={{ uri: selection.uri }}
              style={{ width: 300, height: 300, resizeMode: 'contain' }}
            />
          )}
        </View>
        <MonoText>{JSON.stringify(selection, null, 2)}</MonoText>
      </View>
    );
  };
}
