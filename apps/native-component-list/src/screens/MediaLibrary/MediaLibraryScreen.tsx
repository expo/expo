import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import { router, useFocusEffect, type NativeStackScreenProps } from 'expo-router';
import React from 'react';
import {
  Alert,
  ActivityIndicator,
  Button as RNButton,
  Dimensions,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import Colors from '../../constants/Colors';
import MediaLibraryCell from './MediaLibraryCell';

const COLUMNS = 3;
const PAGE_SIZE = COLUMNS * 10;
const WINDOW_SIZE = Dimensions.get('window');

type MediaTypeWithoutPairedVideo = Exclude<MediaLibrary.MediaTypeValue, 'pairedVideo'>;

const mediaTypeStates: Record<MediaTypeWithoutPairedVideo, MediaTypeWithoutPairedVideo> = {
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

// Route params must stay serializable, so screens pass ids and refetch the data they need.
type Links = {
  MediaLibrary: { albumId?: string; albumTitle?: string };
  MediaDetails: { assetId: string; albumId?: string; albumTitle?: string };
  MediaAlbums: undefined;
};

type Props = NativeStackScreenProps<Links, 'MediaLibrary'> & {
  accessPrivileges?: MediaLibrary.PermissionResponse['accessPrivileges'];
};

type FetchState = {
  refreshing: boolean;
  fetching: boolean;
  assets: MediaLibrary.Asset[];
  endCursor: string | null;
  hasNextPage: boolean;
};

const initialState: FetchState = {
  refreshing: true,
  fetching: true,
  assets: [],
  endCursor: null,
  hasNextPage: true,
};

function reducer(
  state: FetchState,
  {
    type,
    ...action
  }: ({ type: 'reset' } & Partial<FetchState>) | ({ type: 'update' } & Partial<FetchState>)
): FetchState {
  switch (type) {
    case 'reset':
      return { ...initialState, ...action };
    case 'update':
      return { ...state, ...action };
  }
}

function useMediaLibraryPermissions(): [undefined | MediaLibrary.PermissionResponse] {
  const [permissions, setPermissions] = React.useState<
    undefined | MediaLibrary.PermissionResponse
  >();

  React.useEffect(() => {
    async function askAsync() {
      const response = await MediaLibrary.requestPermissionsAsync();
      setPermissions(response);
    }

    askAsync();
  }, []);

  return [permissions];
}

export default function MediaLibraryScreen({ navigation, route }: Props) {
  const albumId = route.params?.albumId;

  // Set the navigation options
  React.useLayoutEffect(() => {
    const goToAlbums = () => router.push('/apis/mediaalbums');
    const clearAlbumSelection = () =>
      navigation.setParams({ albumId: undefined, albumTitle: undefined });
    const addImage = async () => {
      const randomNameGenerator: (num: number) => string = (num) => {
        let res = '';
        for (let i = 0; i < num; i++) {
          const random = Math.floor(Math.random() * 27);
          res += String.fromCharCode(97 + random);
        }
        return res;
      };

      const localPath = FileSystem.cacheDirectory + randomNameGenerator(5) + '.jpg';
      await FileSystem.downloadAsync('https://picsum.photos/200', localPath);
      await MediaLibrary.saveToLibraryAsync(localPath);
      await FileSystem.deleteAsync(localPath);
    };

    const removeAlbum = async () => {
      await MediaLibrary.deleteAlbumsAsync(albumId!);
      clearAlbumSelection();
    };

    navigation.setOptions({
      title: 'Media Library',
      headerRight: () => (
        <View style={{ marginRight: 5, flexDirection: 'row' }}>
          <RNButton
            title={albumId ? 'Remove' : 'Add'}
            onPress={albumId ? removeAlbum : addImage}
            color={Colors.tintColor}
          />
          <View style={{ width: 5 }} />
          <RNButton
            title={albumId ? 'Show all' : 'Albums'}
            onPress={albumId ? clearAlbumSelection : goToAlbums}
            color={Colors.tintColor}
          />
        </View>
      ),
    });
  }, [albumId, navigation]);

  // Ensure the permissions are granted.
  const [permission] = useMediaLibraryPermissions();

  if (!permission) {
    return null;
  }
  if (!permission.granted) {
    return (
      <View style={styles.permissions}>
        <BodyText>
          Missing MEDIA_LIBRARY permission. To continue, you'll need to allow media gallery access
          in Settings.
        </BodyText>
      </View>
    );
  }

  return (
    <MediaLibraryView
      navigation={navigation}
      route={route}
      accessPrivileges={(permission as MediaLibrary.PermissionResponse).accessPrivileges}
    />
  );
}

// The fetching and sorting logic is split out from the navigation and permission logic for simplicity.
function MediaLibraryView({ navigation, route, accessPrivileges }: Props) {
  const albumId = route.params?.albumId;
  const albumTitle = route.params?.albumTitle;

  const isLoadingAssets = React.useRef(false);

  const [sortBy, setSortBy] = React.useState<MediaLibrary.SortByKey>(MediaLibrary.SortBy.default);
  const [mediaType, setMediaType] = React.useState<MediaTypeWithoutPairedVideo>(
    MediaLibrary.MediaType.photo
  );

  const [state, dispatch] = React.useReducer(reducer, initialState);

  // Update without showing the refresh indicator whenever the sorting parameters change.
  React.useEffect(() => {
    dispatch({ type: 'reset', refreshing: false });
  }, [mediaType, sortBy, albumId]);

  const toggleMediaType = React.useCallback(() => {
    setMediaType(mediaTypeStates[mediaType]);
  }, [setMediaType, mediaType]);

  const toggleSortBy = React.useCallback(() => {
    setSortBy(sortByStates[sortBy]);
  }, [setSortBy, sortBy]);

  const loadMoreAssets = React.useCallback(async () => {
    if (
      // if a fetch operation is still in progress or there are no more assets then bail out.
      isLoadingAssets.current ||
      !state.hasNextPage
    ) {
      return;
    }
    // Prevent fetching while another request is still in progress.
    isLoadingAssets.current = true;

    try {
      // Make a native request for assets.
      const { assets, endCursor, hasNextPage } = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: state.endCursor ?? undefined,
        mediaType,
        mediaSubtypes: [],
        sortBy,
        album: albumId,
      });

      // Get the last asset currently in the state.
      const lastAsset = state.assets[state.assets.length - 1];

      const shouldUpdateState = !lastAsset || lastAsset.id === state.endCursor;
      // Guard against updating on an unmounted component.
      if (shouldUpdateState) {
        dispatch({
          type: 'update',
          fetching: false,
          refreshing: false,
          assets: ([] as MediaLibrary.Asset[]).concat(state.assets, assets),
          endCursor,
          hasNextPage,
        });
      }
    } finally {
      // Toggle this back to false in a finally to ensure we can reload later, even if an error ocurred.
      isLoadingAssets.current = false;
    }
  }, [state.endCursor, state.hasNextPage, state.assets, mediaType, sortBy, albumId]);

  // Fetch data whenever the state.fetching value is true.
  React.useEffect(() => {
    if (state.fetching) {
      loadMoreAssets();
    }
  }, [loadMoreAssets, state.fetching]);

  const refresh = React.useCallback((refreshing = true) => {
    dispatch({ type: 'reset', refreshing });
  }, []);

  // Subscribe to state changes
  const isFirstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      // The details screen may delete or modify assets while this screen is unfocused
      // (and its listener removed), so refresh whenever the screen regains focus.
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
      } else {
        dispatch({ type: 'reset', refreshing: false });
      }
      // When new media is added or removed, update the library
      const subscription = MediaLibrary.addListener((event) => {
        if (!event.hasIncrementalChanges) {
          dispatch({ type: 'reset', refreshing: false });
          return;
        }
        dispatch({ type: 'update', fetching: true, endCursor: null, hasNextPage: true });
      });
      return () => {
        subscription.remove();
      };
    }, [])
  );

  const onCellPress = React.useCallback(
    (asset: MediaLibrary.Asset) => {
      router.push({
        pathname: '/apis/mediadetails',
        params: { assetId: asset.id, albumId, albumTitle },
      });
    },
    [albumId, albumTitle]
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
          {albumId ? `Album: ${albumTitle}` : 'All albums'}
        </HeadingText>

        <View style={styles.headerButtons}>
          <Button
            style={styles.button}
            title={`Media type: ${mediaType}`}
            onPress={toggleMediaType}
          />
          <Button style={styles.button} title={`Sort by key: ${sortBy}`} onPress={toggleSortBy} />
        </View>
        {accessPrivileges === 'limited' && (
          <View style={styles.headerButtons}>
            <Button
              style={styles.button}
              title="Change permissions"
              onPress={async () => {
                try {
                  await MediaLibrary.presentPermissionsPickerAsync();
                } catch (e) {
                  Alert.alert(JSON.stringify(e));
                }
              }}
            />
          </View>
        )}
      </View>
    );
  }, [mediaType, albumId, albumTitle, sortBy, toggleMediaType, toggleSortBy]);

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
          <BodyText>{`You don't have any assets with type: ${mediaType}`}</BodyText>
        </View>
      );
    }
    return null;
  }, [state.refreshing, state.assets, mediaType]);

  const keyExtractor = (item: MediaLibrary.Asset) => item.id;

  const onEndReached = React.useCallback(() => {
    dispatch({ type: 'update', fetching: true });
  }, []);

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
