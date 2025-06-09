import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

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

export default function Photo({ uri, onSelectionToggle }: Props) {
  const [state, setState] = React.useState<State>({
    selected: false,
    uri: undefined,
    isVideo: false,
  });

  useEffect(() => {
    if (uri.endsWith('jpg') || uri.endsWith('png')) {
      setState((state) => ({ ...state, uri }));
    } else {
      getVideoThumbnail(uri).then((uri) => setState((state) => ({ ...state, uri, isVideo: true })));
    }
  }, []);

  const toggleSelection = () => {
    setState((prevState) => {
      const newSelected = !prevState.selected;
      uri && onSelectionToggle(uri, newSelected);
      return { ...prevState, selected: newSelected };
    });
  };

  const getVideoThumbnail = async (videoUri: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 250 });
      return uri;
    } catch (error) {
      console.warn(error);
      return undefined;
    }
  };

  return (
    <TouchableOpacity style={styles.pictureWrapper} onPress={toggleSelection} activeOpacity={1}>
      {uri && <Image style={styles.picture} source={{ uri: state.uri }} />}
      {state.isVideo && (
        <Ionicons name="videocam" size={24} color="#ffffffbb" style={styles.videoIcon} />
      )}
      {state.selected && <Ionicons name="checkmark-circle" size={30} color="#4630EB" />}
    </TouchableOpacity>
  );
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
