import Ionicons from '@expo/vector-icons/Ionicons';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

const pictureSize = 150;

type State = {
  uri?: string;
  selected: boolean;
  isVideo: boolean;
};

type Props = {
  uri: string;
  onSelectionToggle: (uri: string, selected: boolean) => void;
};

export default class Photo extends React.Component<Props, State> {
  readonly state: State = {
    selected: false,
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
        onPress={this.toggleSelection}
        activeOpacity={1}>
        {uri && <Image style={styles.picture} source={{ uri }} />}
        {this.state.isVideo && (
          <Ionicons name="videocam" size={24} color="#ffffffbb" style={styles.videoIcon} />
        )}
        {this.state.selected && <Ionicons name="checkmark-circle" size={30} color="#4630EB" />}
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
