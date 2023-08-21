import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
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
  Text,
  View,
} from 'react-native';

import MediaLibraryCell from './MediaLibraryCell';
import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import Colors from '../../constants/Colors';

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

type Links = {
  MediaLibrary: { asset: MediaLibrary.Asset; onGoBack: () => void; album: MediaLibrary.Album };
  MediaDetails: { asset: MediaLibrary.Asset; onGoBack: () => void; album: MediaLibrary.Album };
  MediaAlbums: undefined;
};

type Props = StackScreenProps<Links, 'MediaLibrary'> & {
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
  const album = route.params?.album;

  // Set the navigation options
  React.useLayoutEffect(() => {
    const goToAlbums = () => navigation.navigate('MediaAlbums');
    const clearAlbumSelection = () => navigation.setParams({ album: undefined });
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
      await MediaLibrary.deleteAlbumsAsync(album);
      clearAlbumSelection();
    };

    navigation.setOptions({
      title: 'Media Library',
      headerRight: () => (
        <View style={{ marginRight: 5, flexDirection: 'row' }}>
          <RNButton
            title={album ? 'Remove' : 'Add'}
            onPress={album ? removeAlbum : addImage}
            color={Colors.tintColor}
          />
          <View style={{ width: 5 }} />
          <RNButton
            title={album ? 'Show all' : 'Albums'}
            onPress={album ? clearAlbumSelection : goToAlbums}
            color={Colors.tintColor}
          />
        </View>
      ),
    });
  }, [album, navigation]);

  // Ensure the permissions are granted.
  const [permission] = useMediaLibraryPermissions();

  if (!permission) {
    return null;
  }
  if (!permission.granted) {
    return (
      <View style={styles.permissions}>
        <Text>
          Missing MEDIA_LIBRARY permission. To continue, you'll need to allow media gallery access
          in Settings.
        </Text>
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
  const album = route.params?.album;

  const isLoadingAssets = React.useRef(false);

  const [sortBy, setSortBy] = React.useState<MediaLibrary.SortByKey>(MediaLibrary.SortBy.default);
  const [mediaType, setMediaType] = React.useState<MediaLibrary.MediaTypeValue>(
    MediaLibrary.MediaType.photo
  );

  const [state, dispatch] = React.useReducer(reducer, initialState);

  // Update without showing the refresh indicator whenever the sorting parameters change.
  React.useEffect(() => {
    dispatch({ type: 'reset', refreshing: false });
  }, [mediaType, sortBy, album?.id]);

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
        sortBy,
        album: album?.id,
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
  }, [state.endCursor, state.hasNextPage, state.assets, mediaType, sortBy, album?.id]);

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
  useFocusEffect(
    React.useCallback(() => {
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
