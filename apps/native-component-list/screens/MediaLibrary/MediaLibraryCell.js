import React from 'react';
import PropTypes from 'prop-types';
import { MediaLibrary } from 'expo';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default class MediaLibraryCell extends React.Component {
  static propTypes = {
    asset: PropTypes.object.isRequired,
    onPress: PropTypes.func.isRequired,
  };

  onPress = () => {
    const { asset } = this.props;
    this.props.onPress(asset);
  };

  getAssetData(asset) {
    switch (asset.mediaType) {
      case MediaLibrary.MediaType.photo:
        return {
          icon: 'photo',
          description: `${asset.width}x${asset.height}`,
          preview: <Image style={styles.preview} source={{ uri: asset.uri }} resizeMode="cover" />,
        };
      case MediaLibrary.MediaType.video:
        return {
          icon: 'video-camera',
          description: `${Math.round(asset.duration)}s`,
          preview: <Image style={styles.preview} source={{ uri: asset.uri }} resizeMode="cover" />,
        };
      case MediaLibrary.MediaType.audio:
        return {
          icon: 'music',
          description: `${Math.round(asset.duration)}s`,
          preview: (
            <View style={[styles.preview, styles.audioPreview]}>
              <Text>Audio</Text>
            </View>
          ),
        };
      default:
        return null;
    }
  }

  render() {
    const { asset, style } = this.props;
    const data = this.getAssetData(asset);

    return (
      <TouchableOpacity style={[styles.container, style]} onPress={this.onPress}>
        {data && data.preview}
        {data && (
          <View style={styles.cellFooter}>
            <FontAwesome name={data.icon} size={12} color="white" />
            <Text style={styles.description}>{data.description}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    padding: 1,
  },
  preview: {
    flex: 1,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFooter: {
    height: 18,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    left: 1,
    right: 1,
    bottom: 1,
  },
  description: {
    paddingHorizontal: 5,
    fontSize: 12,
    color: 'white',
  },
});
