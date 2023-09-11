import { StackScreenProps } from '@react-navigation/stack';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import React from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

const EXPO_ALBUM_NAME = 'Expo';

type Links = {
  MediaDetails: { asset: MediaLibrary.Asset; onGoBack: () => void; album: MediaLibrary.Album };
};

type Props = StackScreenProps<Links, 'MediaDetails'>;

export default class MediaDetailsScreen extends React.Component<Props> {
  static navigationOptions = {
    title: 'MediaLibrary Asset',
  };

  state = {
    details: null,
    detailsWithoutDownloadingFromNetwork: null,
  };

  componentDidMount() {
    const { asset } = this.props.route.params;
    MediaLibrary.getAssetInfoAsync(asset, { shouldDownloadFromNetwork: false }).then((details) => {
      this.setState({ detailsWithoutDownloadingFromNetwork: details });
    });
    MediaLibrary.getAssetInfoAsync(asset).then((details) => {
      this.setState({ details });
    });
  }

  goBack() {
    const { navigation, route } = this.props;
    const { onGoBack } = route.params;

    if (onGoBack) {
      onGoBack();
    }
    navigation.goBack();
  }

  deleteAsset = async () => {
    const { asset } = this.props.route.params!;

    await MediaLibrary.deleteAssetsAsync([asset]);
    this.goBack();
  };

  addToAlbum = async () => {
    const permissions = await MediaLibrary.getPermissionsAsync();
    if (permissions?.accessPrivileges && permissions.accessPrivileges !== 'all') {
      Alert.alert('Access to all photos is required to do this operation');
      return;
    }

    const { asset } = this.props.route.params!;
    const expoAlbum = await MediaLibrary.getAlbumAsync(EXPO_ALBUM_NAME);

    if (expoAlbum) {
      await MediaLibrary.addAssetsToAlbumAsync(asset, expoAlbum);
    } else {
      await MediaLibrary.createAlbumAsync(EXPO_ALBUM_NAME, asset);
    }

    alert('Successfully added asset to Expo album!');
  };

  removeFromAlbum = async () => {
    const { asset, album } = this.props.route.params!;

    if (album) {
      await MediaLibrary.removeAssetsFromAlbumAsync(asset.id, album.id);
      this.goBack();
    }
  };

  renderAsset(asset: MediaLibrary.Asset) {
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
    const { asset, album } = this.props.route.params!;

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
