import { StackScreenProps } from '@react-navigation/stack';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library/legacy';
import React from 'react';
import { ScrollView, StyleSheet, View, Alert, Platform } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

const EXPO_ALBUM_NAME = 'Expo';

// Route params must stay serializable, so this screen receives ids and refetches the asset.
type Links = {
  MediaDetails: { assetId: string; albumId?: string; albumTitle?: string };
};

type Props = StackScreenProps<Links, 'MediaDetails'>;

export default class MediaDetailsScreen extends React.Component<Props> {
  static navigationOptions = {
    title: 'MediaLibrary Asset',
  };

  state: {
    details: MediaLibrary.AssetInfo | null;
    detailsWithoutDownloadingFromNetwork: MediaLibrary.AssetInfo | null;
  } = {
    details: null,
    detailsWithoutDownloadingFromNetwork: null,
  };

  componentDidMount() {
    this.getAssetDetails();
  }

  getAssetDetails = () => {
    const { assetId } = this.props.route.params;
    MediaLibrary.getAssetInfoAsync(assetId, { shouldDownloadFromNetwork: false }).then(
      (details) => {
        this.setState({ detailsWithoutDownloadingFromNetwork: details });
      }
    );
    MediaLibrary.getAssetInfoAsync(assetId).then((details) => {
      this.setState({ details });
    });
  };

  deleteAsset = async () => {
    const { assetId } = this.props.route.params;

    await MediaLibrary.deleteAssetsAsync([assetId]);
    this.props.navigation.goBack();
  };

  addToAlbum = async () => {
    const permissions = await MediaLibrary.getPermissionsAsync();
    if (permissions?.accessPrivileges && permissions.accessPrivileges !== 'all') {
      Alert.alert('Access to all photos is required to do this operation');
      return;
    }

    const { assetId } = this.props.route.params;
    const expoAlbum = await MediaLibrary.getAlbumAsync(EXPO_ALBUM_NAME);

    if (expoAlbum) {
      await MediaLibrary.addAssetsToAlbumAsync(assetId, expoAlbum);
    } else {
      await MediaLibrary.createAlbumAsync(EXPO_ALBUM_NAME, assetId);
    }

    alert('Successfully added asset to Expo album!');
  };

  removeFromAlbum = async () => {
    const { assetId, albumId } = this.props.route.params;

    if (albumId) {
      await MediaLibrary.removeAssetsFromAlbumAsync(assetId, albumId);
      this.props.navigation.goBack();
    }
  };

  addToFavorites = async () => {
    const { assetId } = this.props.route.params;

    const success = await MediaLibrary.setAssetFavoriteAsync(assetId, true);
    if (success) {
      alert('Asset marked as favorite!');
      this.getAssetDetails();
    }
  };

  removeFromFavorites = async () => {
    const { assetId } = this.props.route.params;

    const success = await MediaLibrary.setAssetFavoriteAsync(assetId, false);
    if (success) {
      alert('Asset removed from favorites!');
      this.getAssetDetails();
    }
  };

  renderAsset(asset: MediaLibrary.AssetInfo) {
    const aspectRatio = asset.height ? asset.width / asset.height : 1;

    switch (asset.mediaType) {
      case MediaLibrary.MediaType.photo:
      case MediaLibrary.MediaType.video: // TODO: render Expo.Video component
        return (
          <Image
            style={[styles.image, { aspectRatio }]}
            source={{ uri: asset.uri }}
            contentFit="cover"
          />
        );
      default:
        return null;
    }
  }

  render() {
    const { details, detailsWithoutDownloadingFromNetwork } = this.state;
    const { albumId, albumTitle } = this.props.route.params;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.buttons}>
          <Button
            style={styles.button}
            buttonStyle={{ backgroundColor: 'red' }}
            title="Delete asset"
            onPress={this.deleteAsset}
          />
          {albumId && (
            <Button
              style={styles.button}
              buttonStyle={{ backgroundColor: 'red' }}
              title={`Remove from ${albumTitle} album`}
              onPress={this.removeFromAlbum}
            />
          )}
        </View>
        {(!albumId || albumTitle !== EXPO_ALBUM_NAME) && (
          <View style={styles.buttons}>
            <Button style={styles.button} title="Add to Expo album" onPress={this.addToAlbum} />
          </View>
        )}

        {!albumId && details && Platform.OS === 'ios' && (
          <Button
            style={styles.button}
            buttonStyle={{ backgroundColor: 'green' }}
            title={details.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onPress={details.isFavorite ? this.removeFromFavorites : this.addToFavorites}
          />
        )}

        {details && <View style={styles.imageContainer}>{this.renderAsset(details)}</View>}

        {details && (
          <View style={styles.details}>
            <HeadingText>MediaLibrary.getAssetInfoAsync(assetId)</HeadingText>
            <MonoText>{JSON.stringify(details, null, 2)}</MonoText>
          </View>
        )}

        {detailsWithoutDownloadingFromNetwork && (
          <View style={styles.details}>
            <HeadingText>{`MediaLibrary.getAssetInfoAsync(assetId, { shouldDownloadFromNetwork: false })`}</HeadingText>
            <MonoText>{JSON.stringify(detailsWithoutDownloadingFromNetwork, null, 2)}</MonoText>
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
