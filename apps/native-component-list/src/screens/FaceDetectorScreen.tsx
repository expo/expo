import React from 'react';
import { Image, Platform, View, ScrollView } from 'react-native';
import { ImagePicker, FaceDetector, Permissions } from 'expo';

import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';
import { FaceFeature } from '../../../../packages/expo-face-detector/build/FaceDetector';

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
  faceDetection?: {
    detecting: boolean;
    faces: FaceFeature[];
    image?: FaceDetector.Image;
    error?: any;
  };
}

export default class ImagePickerScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'FaceDetector',
  };

  readonly state: State = {};

  detectFaces = (picture: string) => {
    this.setState({
      faceDetection: {
        detecting: true,
        faces: [],
      },
    });
    FaceDetector.detectFacesAsync(picture, {
      mode: FaceDetector.Constants.Mode.accurate,
      detectLandmarks: FaceDetector.Constants.Landmarks.all,
      runClassifications: FaceDetector.Constants.Classifications.none,
    })
      .then(result => {
        this.setState({
          faceDetection: {
            detecting: false,
            faces: result.faces,
            image: result.image,
          },
        });
      })
      .catch(error => {
        this.setState({
          faceDetection: {
            detecting: false,
            faces: [],
            error,
          },
        });
      });
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
      this.detectFaces(result.uri);
    }
  };
  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton
          onPress={() => this.showPicker(ImagePicker.MediaTypeOptions.Images)}
          title="Pick photo"
        />
        {this._maybeRenderSelection()}
        {this._maybeRenderFaceDetection()}
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
          {selection.type === 'video' ? null : (
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

  _maybeRenderFaceDetection = () => {
    const { selection, faceDetection } = this.state;

    if (!selection || selection.cancelled || !faceDetection) {
      return;
    }

    if (faceDetection && faceDetection.detecting) {
      return (
        <View style={{ marginVertical: 16 }}>
          <MonoText>Detecting faces.</MonoText>
        </View>
      );
    }

    if (faceDetection && faceDetection.error) {
      return (
        <View style={{ marginVertical: 16 }}>
          <MonoText>Somerthing went wrong: {JSON.stringify(faceDetection.error)}</MonoText>
        </View>
      );
    }

    if (faceDetection && !faceDetection.detecting) {
      return (
        <View style={{ marginVertical: 16 }}>
          <MonoText>Detected faces: {JSON.stringify(faceDetection.faces)}</MonoText>
          {faceDetection.image && (
            <MonoText>In image: {JSON.stringify(faceDetection.image)}</MonoText>
          )}
        </View>
      );
    }

    return null;
  };
}
