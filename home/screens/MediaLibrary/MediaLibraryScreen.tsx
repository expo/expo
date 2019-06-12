import * as MediaLibrary from 'expo-media-library';
import * as Permissions from 'expo-permissions';
import React from 'react';
import {
  ActivityIndicator,
  Button,
  Dimensions,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NavigationEvents, NavigationScreenConfig, NavigationScreenProps } from 'react-navigation';
import { connect } from 'react-redux';

import ProfileActions from '../../redux/ProfileActions';
import Store from '../../redux/Store';
import MediaLibraryCell from './MediaLibraryCell';

const RNButton = Button;

const COLUMNS = 3;
const PAGE_SIZE = COLUMNS * 10;
const WINDOW_SIZE = Dimensions.get('window');

const mediaTypeStates: { [key in MediaLibrary.MediaTypeValue]: MediaLibrary.MediaTypeValue } = {
  [MediaLibrary.MediaType.unknown]: MediaLibrary.MediaType.photo,
  [MediaLibrary.MediaType.photo]: MediaLibrary.MediaType.video,
  [MediaLibrary.MediaType.video]: MediaLibrary.MediaType.audio,
  [MediaLibrary.MediaType.audio]: MediaLibrary.MediaType.unknown,
};

const sortByStates: { [key in MediaLibrary.SortByKey]: MediaLibrary.SortByKey } = {
  [MediaLibrary.SortBy.default]: MediaLibrary.SortBy.creationTime,
  [MediaLibrary.SortBy.creationTime]: MediaLibrary.SortBy.modificationTime,
  [MediaLibrary.SortBy.modificationTime]: MediaLibrary.SortBy.mediaType,
  [MediaLibrary.SortBy.mediaType]: MediaLibrary.SortBy.width,
  [MediaLibrary.SortBy.width]: MediaLibrary.SortBy.height,
  [MediaLibrary.SortBy.height]: MediaLibrary.SortBy.duration,
  [MediaLibrary.SortBy.duration]: MediaLibrary.SortBy.default,
};

interface State {
  assets: MediaLibrary.Asset[];
  endCursor?: string;
  hasNextPage?: boolean;
  permission?: Permissions.PermissionStatus;
  refreshing: boolean;
  mediaType: MediaLibrary.MediaTypeValue;
  sortBy: MediaLibrary.SortByKey;
}

@connect()
export default class MediaLibraryScreen extends React.Component<NavigationScreenProps, State> {
  static navigationOptions: NavigationScreenConfig<{}> = {
    title: 'Choose a photo',
  };

  readonly state: State = {
    assets: [],
    refreshing: true,
    mediaType: MediaLibrary.MediaType.photo,
    sortBy: MediaLibrary.SortBy.default,
  };

  isLoadingAssets = false;

  libraryChangeSubscription?: { remove: () => void };

  componentDidFocus = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    this.setState({ permission: status, assets: [], endCursor: undefined, hasNextPage: undefined });
    this.loadMoreAssets();

    if (this.libraryChangeSubscription) {
      this.libraryChangeSubscription.remove();
    }
    this.libraryChangeSubscription = MediaLibrary.addListener(() => {
      this.loadMoreAssets([]);
    });
  };

  componentWillUnmount() {
    this.libraryChangeSubscription!.remove();
    this.libraryChangeSubscription = undefined;
  }

  getAlbum() {
    const { params } = this.props.navigation.state;
    return params && params.album;
  }

  async loadMoreAssets(currentAssets = this.state.assets, cursor = this.state.endCursor) {
    if (
      this.isLoadingAssets ||
      (cursor === this.state.endCursor && this.state.hasNextPage === false)
    ) {
      return;
    }

    const { state } = this;
    const album = this.getAlbum();

    this.isLoadingAssets = true;

    const { assets, endCursor, hasNextPage } = await MediaLibrary.getAssetsAsync({
      first: PAGE_SIZE,
      after: cursor,
      mediaType: state.mediaType,
      sortBy: state.sortBy,
      album: album && album.id,
    });

    const lastAsset = currentAssets[currentAssets.length - 1];

    if (!lastAsset || lastAsset.id === cursor) {
      this.setState({
        assets: ([] as MediaLibrary.Asset[]).concat(currentAssets, assets),
        endCursor,
        hasNextPage,
        refreshing: false,
      });
    }

    this.isLoadingAssets = false;
  }

  refresh = (refreshingFlag = true) => {
    this.setState(
      { assets: [], endCursor: undefined, hasNextPage: undefined, refreshing: refreshingFlag },
      () => {
        this.loadMoreAssets();
      }
    );
  };

  toggleMediaType = () => {
    const mediaType = mediaTypeStates[this.state.mediaType];
    this.setState({ mediaType });
    this.refresh(false);
  };

  toggleSortBy = () => {
    const sortBy = sortByStates[this.state.sortBy];
    this.setState({ sortBy });
    this.refresh(false);
  };

  keyExtractor = (item: MediaLibrary.Asset) => item.id;

  onEndReached = () => {
    this.loadMoreAssets();
  };

  onCellPress = (asset: MediaLibrary.Asset) => {
    Store.dispatch(ProfileActions.setImage(asset.uri));
    this.props.navigation.goBack();
  };

  renderRowItem: ListRenderItem<MediaLibrary.Asset> = ({ item }) => {
    return (
      <MediaLibraryCell
        style={{ width: WINDOW_SIZE.width / COLUMNS }}
        asset={item}
        onPress={this.onCellPress}
      />
    );
  };

  renderFooter = () => {
    const { assets, refreshing, mediaType } = this.state;

    if (refreshing) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator animating />
        </View>
      );
    }
    if (assets.length === 0) {
      return (
        <View style={styles.noAssets}>
          <Text>{`You don't have any assets with type: ${mediaType}`}</Text>
        </View>
      );
    }
    return null;
  };

  renderContent() {
    const { assets, permission, refreshing } = this.state;

    if (!permission) {
      return null;
    }
    if (permission !== 'granted') {
      return (
        <View style={styles.permissions}>
          <Text>
            Missing CAMERA_ROLL permission. To continue, you'll need to allow media gallery access
            in Settings.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        contentContainerStyle={styles.flatList}
        data={assets}
        numColumns={COLUMNS}
        keyExtractor={this.keyExtractor}
        onEndReachedThreshold={0.5}
        onEndReached={this.onEndReached}
        renderItem={this.renderRowItem}
        ListFooterComponent={this.renderFooter}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={this.refresh} />}
      />
    );
  }

  render() {
    return (
      <View style={styles.mediaGallery}>
        <NavigationEvents onDidFocus={this.componentDidFocus} />
        {this.renderContent()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mediaGallery: {
    flex: 1,
  },
  flatList: {
    marginHorizontal: 1,
  },
  permissions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginHorizontal: 5,
  },
  header: {
    paddingTop: 0,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  headerText: {
    alignSelf: 'center',
  },
  headerButtons: {
    marginTop: 5,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 10,
  },
  noAssets: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
