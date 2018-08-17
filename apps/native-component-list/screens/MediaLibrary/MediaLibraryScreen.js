import React from 'react';
import { Permissions, MediaLibrary } from 'expo';
import {
  ActivityIndicator,
  Button as RNButton,
  Dimensions,
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';

import Colors from '../../constants/Colors';
import MediaLibraryCell from './MediaLibraryCell';
import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';

const COLUMNS = 3;
const PAGE_SIZE = COLUMNS * 10;
const WINDOW_SIZE = Dimensions.get('window');

const { MediaType, SortBy } = MediaLibrary;

const mediaTypeStates = {
  all: MediaType.photo,
  photo: MediaType.video,
  video: MediaType.audio,
  audio: MediaType.all,
};

const sortByStates = {
  [SortBy.default]: SortBy.creationTime,
  [SortBy.creationTime]: SortBy.modificationTime,
  [SortBy.modificationTime]: SortBy.mediaType,
  [SortBy.mediaType]: SortBy.width,
  [SortBy.width]: SortBy.height,
  [SortBy.height]: SortBy.duration,
  [SortBy.duration]: SortBy.default,
};

export default class MediaLibraryScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const goToAlbums = () => navigation.navigate('MediaAlbums');
    const clearAlbumSelection = () => navigation.pop(2);
    const { params } = navigation.state;
    const isAlbumSet = params && params.album;

    return {
      title: 'MediaLibrary',
      headerRight: (
        <View style={{ marginRight: 5 }}>
          <RNButton
            title={isAlbumSet ? 'Show all' : 'Albums'}
            onPress={isAlbumSet ? clearAlbumSelection : goToAlbums}
            color={Colors.tintColor}
          />
        </View>
      ),
    };
  };

  state = {
    assets: [],
    endCursor: null,
    hasNextPage: null,
    permission: null,
    refreshing: true,
    mediaType: MediaLibrary.MediaType.all,
    sortBy: MediaLibrary.SortBy.default,
  };

  isLoadingAssets = false;

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    this.setState({ permission: status });
    this.loadMoreAssets();

    this.libraryChangeSubscription = MediaLibrary.addListener(() => {
      this.loadMoreAssets([], null);
    });
  }

  componentWillUnmount() {
    this.libraryChangeSubscription.remove();
    this.libraryChangeSubscription = null;
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
        assets: [].concat(currentAssets, assets),
        endCursor,
        hasNextPage,
        refreshing: false,
      });
    }

    this.isLoadingAssets = false;
  }

  refresh = (refreshingFlag = true) => {
    this.setState(
      { assets: [], endCursor: null, hasNextPage: null, refreshing: refreshingFlag },
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

  keyExtractor = item => item.id;

  onEndReached = () => {
    this.loadMoreAssets();
  };

  onCellPress = asset => {
    this.props.navigation.navigate('MediaDetails', {
      asset,
      album: this.getAlbum(),
      onGoBack: this.refresh,
    });
  };

  renderRowItem = ({ item }) => {
    return (
      <MediaLibraryCell
        style={{ width: WINDOW_SIZE.width / COLUMNS }}
        asset={item}
        onPress={this.onCellPress}
      />
    );
  };

  renderHeader = () => {
    const album = this.getAlbum();

    return (
      <View style={styles.header}>
        <HeadingText style={styles.headerText}>
          {album ? `Album: ${album.title}` : 'All albums'}
        </HeadingText>

        <View style={styles.headerButtons}>
          <Button
            style={styles.button}
            title={`Media type: ${this.state.mediaType}`}
            onPress={this.toggleMediaType}
          />
          <Button
            style={styles.button}
            title={`Sort by key: ${this.state.sortBy}`}
            onPress={this.toggleSortBy}
          />
        </View>
      </View>
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

  render() {
    const { assets, permission, refreshing } = this.state;

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
      <View style={styles.mediaGallery}>
        <FlatList
          contentContainerStyle={styles.flatList}
          data={assets}
          numColumns={COLUMNS}
          keyExtractor={this.keyExtractor}
          onEndReachedThreshold={0.5}
          onEndReached={this.onEndReached}
          renderItem={this.renderRowItem}
          ListHeaderComponent={this.renderHeader}
          ListFooterComponent={this.renderFooter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={this.refresh} />}
        />
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
