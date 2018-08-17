import React from 'react';
import { MediaLibrary } from 'expo';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import Button from '../../components/Button';
import MonoText from '../../components/MonoText';
import HeadingText from '../../components/HeadingText';

const EXPO_ALBUM_NAME = 'Expo';

export default class MediaDetailsScreen extends React.Component {
  static navigationOptions = {
    title: 'MediaLibrary Asset',
  };

  state = {
    details: null,
  };

  async componentWillMount() {
    const { asset } = this.props.navigation.state.params;
    const details = await MediaLibrary.getAssetInfoAsync(asset);
    this.setState({ details });
  }

  goBack() {
    const { navigation } = this.props;
    const { onGoBack } = navigation.state.params;

    if (onGoBack) {
      onGoBack();
    }
    navigation.goBack();
  }

  deleteAsset = async () => {
    const { asset } = this.props.navigation.state.params;

    await MediaLibrary.deleteAssetsAsync([asset]);
    this.goBack();
  };

  addToAlbum = async () => {
    const { asset } = this.props.navigation.state.params;
    const expoAlbum = await MediaLibrary.getAlbumAsync(EXPO_ALBUM_NAME);

    if (expoAlbum) {
      await MediaLibrary.addAssetsToAlbumAsync(asset, expoAlbum);
    } else {
      await MediaLibrary.createAlbumAsync(EXPO_ALBUM_NAME, asset);
    }

    alert('Successfully added asset to Expo album!');
  };

  removeFromAlbum = async () => {
    const { asset, album } = this.props.navigation.state.params;

    if (album) {
      await MediaLibrary.removeAssetsFromAlbumAsync(asset.id, album.id);
      this.goBack();
    }
  };

  renderAsset(asset) {
    const aspectRatio = asset.height ? asset.width / asset.height : 1;

    switch (asset.mediaType) {
      case MediaLibrary.MediaType.photo:
      case MediaLibrary.MediaType.video: // TODO: render Expo.Video component
        return (
          <Image
            style={[styles.image, { aspectRatio }]}
            source={{ uri: asset.uri }}
            resizeMode="cover"
          />
        );
      default:
        return null;
    }
  }

  render() {
    const { details } = this.state;
    const { asset, album } = this.props.navigation.state.params;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.buttons}>
          <Button
            style={styles.button}
            buttonStyle={{ backgroundColor: 'red' }}
            title="Delete asset"
            onPress={this.deleteAsset}
          />
          {album && (
            <Button
              style={styles.button}
              buttonStyle={{ backgroundColor: 'red' }}
              title={`Remove from ${album.title} album`}
              onPress={this.removeFromAlbum}
            />
          )}
        </View>
        {(!album || album.title !== EXPO_ALBUM_NAME) && (
          <View style={styles.buttons}>
            <Button style={styles.button} title="Add to Expo album" onPress={this.addToAlbum} />
          </View>
        )}

        <View style={styles.imageContainer}>{this.renderAsset(asset)}</View>

        <HeadingText>Base asset data</HeadingText>
        <MonoText>{JSON.stringify(asset, null, 2)}</MonoText>

        { details && (
          <View style={styles.details}>
            <HeadingText>MediaLibrary.getAssetInfoAsync(assetId)</HeadingText>
            <MonoText>{JSON.stringify(details, null, 2)}</MonoText>
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    flex: 1,
  },
  buttons: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginHorizontal: 5,
  },
  imageContainer: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 25,
    justifyContent: 'center',
  },
  image: {
    flex: 1,
  },
  details: {
    marginBottom: 10,
  },
});
