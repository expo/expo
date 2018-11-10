import React from 'react';
import { Alert, ScrollView, View, Platform, Image } from 'react-native';
import { ImagePicker, Permissions, Video } from 'expo';
import { NavigationEvents } from 'react-navigation';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';

export default class ImagePickerScreen extends React.Component {
  static navigationOptions = {
    title: 'ImagePicker',
  };
  state = {
    selection: null,
  };

  async componentDidFocus() {
    await Permissions.askAsync(Permissions.CAMERA);
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
  }

  render() {
    const showCamera = async () => {
      let result = await ImagePicker.launchCameraAsync({});
      if (result.cancelled) {
        this.setState({ selection: null });
      } else {
        this.setState({ selection: result });
      }
    };

    const showPicker = async () => {
      if (Platform.OS === 'ios') {
        let permission = await Permissions.getAsync(Permissions.CAMERA_ROLL);
        if (permission.status !== 'granted') {
          setTimeout(() => Alert.alert('Camera roll permission was not granted.'), 100);
          return;
        }
      }
      let result = await ImagePicker.launchImageLibraryAsync({});
      if (result.cancelled) {
        this.setState({ selection: null });
      } else {
        this.setState({ selection: result });
      }
    };

    const showPickerWithEditing = async () => {
      if (Platform.OS === 'ios') {
        let permission = await Permissions.getAsync(Permissions.CAMERA_ROLL);
        if (permission.status !== 'granted') {
          setTimeout(() => Alert.alert('Camera roll permission was not granted.'), 100);
          return;
        }
      }
      let result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true });
      if (result.cancelled) {
        this.setState({ selection: null });
      } else {
        this.setState({ selection: result });
      }
    };

    return (
      <ScrollView style={{ padding: 10 }}>
        <NavigationEvents onDidFocus={this.componentDidFocus} />
        <ListButton onPress={showCamera} title="Open camera" />
        <ListButton onPress={showPicker} title="Pick photo or video" />
        <ListButton onPress={showPickerWithEditing} title="Pick photo and edit" />

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
