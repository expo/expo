import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as MediaLibrary from 'expo-media-library';
import * as Permissions from 'expo-permissions';
import React from 'react';
import {
  ActivityIndicator,
  Button as RNButton,
  Dimensions,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import Colors from '../../constants/Colors';
import MediaLibraryCell from './MediaLibraryCell';

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

type Links = {
  MediaLibrary: { asset: MediaLibrary.Asset; onGoBack: () => void; album: MediaLibrary.Album };
  MediaDetails: { asset: MediaLibrary.Asset; onGoBack: () => void; album: MediaLibrary.Album };
  MediaAlbums: undefined;
};

type Props = { navigation: StackNavigationProp<Links>; route: RouteProp<Links, 'MediaLibrary'> };

export default function MediaLibraryScreen(props: Props) {
  const [refreshing, setRefreshing] = React.useState<boolean>(true);
  const [mediaType, setMediaType] = React.useState<MediaLibrary.MediaTypeValue>(
    MediaLibrary.MediaType.photo
  );
  const [assets, setAssets] = React.useState<MediaLibrary.Asset[]>([]);
  const [sortBy, setSortBy] = React.useState<MediaLibrary.SortByKey>(MediaLibrary.SortBy.default);
  const [endCursor, setEndCursor] = React.useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = React.useState<boolean | null>(null);
  const [permission, setPermission] = React.useState<MediaLibrary.PermissionStatus>(
    MediaLibrary.PermissionStatus.UNDETERMINED
  );

  let isLoadingAssets = false;

  let libraryChangeSubscription: { remove: () => void } | null = null;

  const componentDidFocus = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    setPermission(status);
    setAssets([]);
    setEndCursor(null);
    setHasNextPage(null);
    loadMoreAssets();

    if (libraryChangeSubscription) {
      libraryChangeSubscription.remove();
    }
    libraryChangeSubscription = MediaLibrary.addListener(() => {
      loadMoreAssets([]);
    });
  };

  React.useEffect(() => {
    return () => {
      libraryChangeSubscription!.remove();
    };
  }, []);

  const getAlbum = () => {
    return props.route.params.album;
  };

  const loadMoreAssets = async (currentAssets = assets, cursor = endCursor) => {
    if (isLoadingAssets || (cursor === endCursor && hasNextPage === false)) {
      return;
    }

    const album = getAlbum();

    isLoadingAssets = true;

    const {
      assets,
      endCursor: nextEndCursor,
      hasNextPage: nextHasNextPage,
    } = await MediaLibrary.getAssetsAsync({
      first: PAGE_SIZE,
      after: cursor ?? undefined,
      mediaType,
      sortBy,
      album: album?.id,
    });

    const lastAsset = currentAssets[currentAssets.length - 1];

    if (!lastAsset || lastAsset.id === cursor) {
      setAssets(([] as MediaLibrary.Asset[]).concat(currentAssets, assets));
      setEndCursor(nextEndCursor);
      setHasNextPage(nextHasNextPage);
      setRefreshing(false);
    }

    isLoadingAssets = false;
  };

  const refresh = (refreshingFlag = true) => {
    setAssets([]);
    setEndCursor(null);
    setHasNextPage(null);
    setRefreshing(refreshingFlag);

    loadMoreAssets();
  };

  const toggleMediaType = () => {
    setMediaType(mediaTypeStates[mediaType]);
    refresh(false);
  };

  const toggleSortBy = () => {
    setSortBy(sortByStates[sortBy]);
    refresh(false);
  };

  const keyExtractor = (item: MediaLibrary.Asset) => item.id;

  const onEndReached = () => {
    loadMoreAssets();
  };

  const onCellPress = (asset: MediaLibrary.Asset) => {
    props.navigation.navigate('MediaDetails', {
      asset,
      album: getAlbum(),
      onGoBack: refresh,
    });
  };

  const renderRowItem: ListRenderItem<MediaLibrary.Asset> = ({ item }) => {
    return (
      <MediaLibraryCell
        style={{ width: WINDOW_SIZE.width / COLUMNS }}
        asset={item}
        onPress={onCellPress}
      />
    );
  };

  const renderHeader = () => {
    const album = getAlbum();

    return (
      <View style={styles.header}>
        <HeadingText style={styles.headerText}>
          {album ? `Album: ${album.title}` : 'All albums'}
        </HeadingText>

        <View style={styles.headerButtons}>
          <Button
            style={styles.button}
            title={`Media type: ${mediaType}`}
            onPress={toggleMediaType}
          />
          <Button style={styles.button} title={`Sort by key: ${sortBy}`} onPress={toggleSortBy} />
        </View>
      </View>
    );
  };

  const renderFooter = () => {
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

  useFocusEffect(() => {
    componentDidFocus();
  });

  if (!permission) {
    return null;
  }
  if (permission !== 'granted') {
    return (
      <View style={styles.permissions}>
        <Text>
          Missing CAMERA_ROLL permission. To continue, you'll need to allow media gallery access in
          Settings.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.flatList}
      data={assets}
      numColumns={COLUMNS}
      keyExtractor={keyExtractor}
      onEndReachedThreshold={0.5}
      onEndReached={onEndReached}
      renderItem={renderRowItem}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    />
  );
}

MediaLibraryScreen.navigationOptions = ({ navigation, route }: Props) => {
  const goToAlbums = () => navigation.navigate('MediaAlbums');
  const clearAlbumSelection = () => navigation.setParams({ album: null });
  const isAlbumSet = route.params.album;

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
