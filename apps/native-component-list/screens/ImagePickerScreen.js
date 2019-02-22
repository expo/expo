import { ImagePicker, Permissions, Video } from 'expo';
import React from 'react';
import { Image, Platform, ScrollView, View } from 'react-native';
import { NavigationEvents } from 'react-navigation';

import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';

async function requestPermissionAsync(permission) {
  // Image Picker doesn't need permissions in the web
  if (Platform.OS === 'web') {
    return true;
  }
  const { status } = await Permissions.askAsync(permission);
  return status === 'granted';
}
export default class ImagePickerScreen extends React.Component {
  static navigationOptions = {
    title: 'ImagePicker',
  };

  state = {
    selection: null,
  };

  showCamera = async (mediaTypes, allowsEditing = false) => {
    await requestPermissionAsync(Permissions.CAMERA);
    let result = await ImagePicker.launchCameraAsync({ mediaTypes, allowsEditing });
    if (result.cancelled) {
      this.setState({ selection: null });
    } else {
      this.setState({ selection: result });
    }
  };

  showPicker = async (mediaTypes, allowsEditing = false) => {
    await requestPermissionAsync(Permissions.CAMERA_ROLL);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing,
    });
    if (result.cancelled) {
      this.setState({ selection: null });
    } else {
      this.setState({ selection: result });
    }
  };
  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        <NavigationEvents onDidFocus={this.componentDidFocus} />
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

    if (!selection) {
      return;
    }

    const media =
      selection.type === 'video' ? (
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
      );

    const result = <MonoText>{JSON.stringify(selection, null, 2)}</MonoText>;

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
          {media}
        </View>
        {result}
      </View>
    );
  };
}
