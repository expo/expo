import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { usePermissions } from '@use-expo/permissions';
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

type FetchState = {
  refreshing: boolean;
  assets: MediaLibrary.Asset[];
  endCursor: string | null;
  hasNextPage: boolean | null;
};

const initialState: FetchState = {
  refreshing: true,
  assets: [],
  endCursor: null,
  hasNextPage: null,
};

function reducer(
  state: FetchState,
  action:
    | ({ type: 'reset' } & Pick<FetchState, 'refreshing'>)
    | ({ type: 'fetched' } & Omit<FetchState, 'refreshing'>)
): FetchState {
  switch (action.type) {
    case 'reset':
      return { ...initialState, refreshing: action.refreshing };
    case 'fetched':
      return { ...state, refreshing: false };
  }
}

export default function MediaLibraryScreen({ navigation, route }: Props) {
  const album = route.params?.album;

  const [permission] = usePermissions(Permissions.CAMERA_ROLL, { ask: true });
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [sortBy, setSortBy] = React.useState<MediaLibrary.SortByKey>(MediaLibrary.SortBy.default);

  const [mediaType, setMediaType] = React.useState<MediaLibrary.MediaTypeValue>(
    MediaLibrary.MediaType.photo
  );

  const isLoadingAssets = React.useRef(false);

  const loadMoreAssets = React.useCallback(
    async (currentAssets = state.assets, cursor = state.endCursor) => {
      if (isLoadingAssets.current || (cursor === state.endCursor && state.hasNextPage === false)) {
        return;
      }

      isLoadingAssets.current = true;

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
        dispatch({
          type: 'fetched',
          assets: ([] as MediaLibrary.Asset[]).concat(currentAssets, assets),
          endCursor: nextEndCursor,
          hasNextPage: nextHasNextPage,
        });
      }

      isLoadingAssets.current = false;
    },
    [state.endCursor, state.hasNextPage, state.assets, mediaType, sortBy, album?.id]
  );

  const refresh = React.useCallback(
    (refreshingFlag = true) => {
      dispatch({ type: 'reset', refreshing: refreshingFlag });
      loadMoreAssets();
    },
    [loadMoreAssets]
  );

  const toggleMediaType = React.useCallback(() => {
    setMediaType(mediaTypeStates[mediaType]);
    refresh(false);
  }, [mediaType, setMediaType, refresh]);

  const toggleSortBy = React.useCallback(() => {
    setSortBy(sortByStates[sortBy]);
    refresh(false);
  }, [sortBy, setSortBy, refresh]);

  const keyExtractor = (item: MediaLibrary.Asset) => item.id;

  const onEndReached = () => {
    loadMoreAssets();
  };

  const onCellPress = React.useCallback(
    (asset: MediaLibrary.Asset) => {
      navigation.navigate('MediaDetails', {
        asset,
        album,
        onGoBack: refresh,
      });
    },
    [navigation, album, refresh]
  );

  const renderRowItem: ListRenderItem<MediaLibrary.Asset> = React.useCallback(
    ({ item }) => {
      return (
        <MediaLibraryCell
          style={{ width: WINDOW_SIZE.width / COLUMNS }}
          asset={item}
          onPress={onCellPress}
        />
      );
    },
    [onCellPress]
  );

  const renderHeader = React.useCallback(() => {
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
  }, [mediaType, album, sortBy, toggleMediaType, toggleSortBy]);

  const renderFooter = React.useCallback(() => {
    if (state.refreshing) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator animating />
        </View>
      );
    }
    if (state.assets.length === 0) {
      return (
        <View style={styles.noAssets}>
          <Text>{`You don't have any assets with type: ${mediaType}`}</Text>
        </View>
      );
    }
    return null;
  }, [state.refreshing, state.assets, mediaType]);

  const onFocus = React.useCallback(() => {
    dispatch({ type: 'reset', refreshing: true });
    loadMoreAssets();
    const libraryChangeSubscription = MediaLibrary.addListener(() => {
      loadMoreAssets([]);
    });
    return () => libraryChangeSubscription.remove();
  }, [loadMoreAssets]);

  useFocusEffect(onFocus);

  if (!permission) {
    return null;
  }
  if (!permission.granted) {
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
      data={state.assets}
      numColumns={COLUMNS}
      keyExtractor={keyExtractor}
      onEndReachedThreshold={0.5}
      onEndReached={onEndReached}
      renderItem={renderRowItem}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={refresh} />}
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
