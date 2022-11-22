import Ionicons from '@expo/vector-icons/build/Ionicons';
import * as FaceDetector from 'expo-face-detector';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const pictureSize = 150;

type State = {
  uri?: string;
  selected: boolean;
  faces: FaceDetector.FaceFeature[];
  image?: FaceDetector.Image;
  isVideo: boolean;
};

type Props = {
  uri: string;
  onSelectionToggle: (uri: string, selected: boolean) => void;
};

export default class Photo extends React.Component<Props, State> {
  readonly state: State = {
    selected: false,
    faces: [],
    uri: undefined,
    isVideo: false,
  };
  _mounted = false;

  componentDidMount() {
    this._mounted = true;

    if (this.props.uri.endsWith('jpg')) {
      this.setState(() => ({ uri: this.props.uri }));
    } else {
      this.getVideoThumbnail(this.props.uri).then((uri) =>
        this.setState(() => ({ uri, isVideo: true }))
      );
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  toggleSelection = () => {
    this.setState(
      (state) => ({ selected: !state.selected }),
      () => this.props.uri && this.props.onSelectionToggle(this.props.uri, this.state.selected)
    );
  };

  detectFace = () =>
    this.state.uri &&
    FaceDetector.detectFacesAsync(this.state.uri, {
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
      runClassifications: FaceDetector.FaceDetectorClassifications.all,
    })
      .then(this.facesDetected)
      .catch(this.handleFaceDetectionError);

  facesDetected = ({
    faces,
    image,
  }: {
    faces: FaceDetector.FaceFeature[];
    image: FaceDetector.Image;
  }) => {
    this.setState({
      faces,
      image,
    });
  };

  getImageDimensions = ({ width, height }: FaceDetector.Image) => {
    if (width > height) {
      const scaledHeight = (pictureSize * height) / width;
      return {
        width: pictureSize,
        height: scaledHeight,

        scaleX: pictureSize / width,
        scaleY: scaledHeight / height,

        offsetX: 0,
        offsetY: (pictureSize - scaledHeight) / 2,
      };
    } else {
      const scaledWidth = (pictureSize * width) / height;
      return {
        width: scaledWidth,
        height: pictureSize,

        scaleX: scaledWidth / width,
        scaleY: pictureSize / height,

        offsetX: (pictureSize - scaledWidth) / 2,
        offsetY: 0,
      };
    }
  };

  handleFaceDetectionError = (error: any) => console.warn(error);

  renderFaces = () => this.state.image && this.state.faces && this.state.faces.map(this.renderFace);

  renderFace = (face: FaceDetector.FaceFeature, index: number) => {
    const { scaleX, scaleY, offsetX, offsetY } = this.getImageDimensions(this.state.image!);
    const layout = {
      top: offsetY + face.bounds.origin.y * scaleY,
      left: offsetX + face.bounds.origin.x * scaleX,
      width: face.bounds.size.width * scaleX,
      height: face.bounds.size.height * scaleY,
    };

    return (
      <View
        key={index}
        style={[
          styles.face,
          layout,
          {
            transform: [
              { perspective: 600 },
              { rotateZ: `${(face.rollAngle || 0).toFixed(0)}deg` },
              { rotateY: `${(face.yawAngle || 0).toFixed(0)}deg` },
            ],
          },
        ]}>
        {face.smilingProbability && (
          <Text style={styles.faceText}>😁 {(face.smilingProbability * 100).toFixed(0)}%</Text>
        )}
      </View>
    );
  };

  getVideoThumbnail = async (videoUri: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 250 });
      return uri;
    } catch (error) {
      console.warn(error);
      return undefined;
    }
  };

  render() {
    const { uri } = this.state;
    return (
      <TouchableOpacity
        style={styles.pictureWrapper}
        onLongPress={this.detectFace}
        onPress={this.toggleSelection}
        activeOpacity={1}>
        <Image style={styles.picture} source={{ uri }} />
        {this.state.isVideo && (
          <Ionicons name="videocam" size={24} color="#ffffffbb" style={styles.videoIcon} />
        )}
        {this.state.selected && <Ionicons name="md-checkmark-circle" size={30} color="#4630EB" />}
        <View style={styles.facesContainer}>{this.renderFaces()}</View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  picture: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    resizeMode: 'contain',
  },
  pictureWrapper: {
    width: pictureSize,
    height: pictureSize,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  facesContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },
  face: {
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
    borderColor: '#FFD700',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  faceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 2,
    fontSize: 10,
    backgroundColor: 'transparent',
  },
  videoIcon: {
    position: 'absolute',
    bottom: 0,
    right: 36,
  },
});
