import * as Device from 'expo-device';
import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import {
  Asset,
  AssetField,
  MediaType,
  AssetInfo,
  Query,
  requestPermissionsAsync,
  MediaSubtype,
} from 'expo-media-library/next';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';

enum TestState {
  START = 'start',
  LOADING = 'loading',
  FINISHED = 'finished',
  ERROR = 'error',
}

const AssetScreen = () => {
  const screenName = 'asset_screen';
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assetInfo, setAssetInfo] = useState<AssetInfo | null>(null);
  const [mediaSubtypes, setMediaSubtypes] = useState<MediaSubtype[] | null>(null);
  const [orientation, setOrientation] = useState<number | null | undefined>(undefined);
  const [isNetworkAsset, setIsNetworkAsset] = useState<boolean | undefined>(undefined);
  const [pairedVideoUri, setPairedVideoUri] = useState<string | null | undefined>(undefined);
  const [testState, setTestState] = useState<TestState>(TestState.START);

  const isVideo = assetInfo?.mediaType === MediaType.VIDEO;

  const getVideoPlayerSource = () => {
    const isIdPresent = asset?.id !== undefined && asset?.id !== null;
    return isVideo && isIdPresent ? asset.id : null;
  };

  const player = useVideoPlayer(getVideoPlayerSource(), (player) => {
    if (player) {
      player.loop = true;
      player.play();
    }
  });

  const pairedVideoPlayer = useVideoPlayer(pairedVideoUri ?? null, (player) => {
    if (player) {
      player.loop = true;
      player.play();
    }
  });

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await requestPermissionsAsync();
      if (status === 'denied') {
        Alert.alert('Permission denied', 'Cannot proceed without media library permissions.');
        setTestState(TestState.ERROR);
      }
    };
    requestPermissions();
  }, []);

  const loadAssetState = async (selectedAsset: Asset) => {
    const info = await selectedAsset.getInfo();
    const subtypes = await selectedAsset.getMediaSubtypes();
    if (Platform.OS === 'ios') {
      const [orient, networkAsset, pairedVideo] = await Promise.all([
        selectedAsset.getOrientation(),
        selectedAsset.getIsInCloud(),
        selectedAsset.getLivePhotoVideoUri(),
      ]);
      setOrientation(orient);
      setIsNetworkAsset(networkAsset);
      setPairedVideoUri(pairedVideo);
    }
    setMediaSubtypes(subtypes);
    setAsset(selectedAsset);
    setAssetInfo(info);
    setTestState(TestState.FINISHED);
  };

  const handleAddAsset = async (type: 'image' | 'video') => {
    setTestState(TestState.LOADING);
    try {
      const file = await downloadFile(type);
      const newAsset = await Asset.create(file.uri);
      await loadAssetState(newAsset);
    } catch (e) {
      console.error('Error adding asset:', e);
      setTestState(TestState.ERROR);
    }
  };

  const handleCheckLibraryForLivePhoto = async () => {
    if (Platform.OS !== 'ios') {
      return;
    }
    setTestState(TestState.LOADING);
    try {
      const assets = await new Query().eq(AssetField.MEDIA_TYPE, MediaType.IMAGE).exe();
      for (const asset of assets) {
        const subtypes = await asset.getMediaSubtypes();
        if (subtypes.includes(MediaSubtype.LIVE_PHOTO)) {
          await loadAssetState(asset);
          return;
        }
      }
      Alert.alert('No Live Photos', 'Create a Live Photo with the Camera app and try again.');
      setTestState(TestState.START);
    } catch (e) {
      console.error('Error checking library for LivePhoto:', e);
      setTestState(TestState.ERROR);
    }
  };

  const handleDeleteAsset = async () => {
    if (asset) {
      try {
        await asset.delete();
        setAsset(null);
        setTestState(TestState.START);
        Alert.alert('Asset deleted');
      } catch (e) {
        console.error('Error deleting asset:', e);
        setTestState(TestState.ERROR);
      }
    }
  };

  const toggleFavorite = async () => {
    if (asset) {
      try {
        await asset.setFavorite(!assetInfo?.isFavorite);
        const updatedInfo = await asset.getInfo();
        setAssetInfo(updatedInfo);
      } catch (e) {
        console.error('Error toggling favorite status:', e);
        Alert.alert('Error', 'Unable to change favorite status of the asset.');
      }
    }
  };

  const downloadFile = async (type: 'image' | 'video'): Promise<File> => {
    try {
      const dir = new Directory(Paths.cache, screenName);
      dir.create({ idempotent: true });

      switch (type) {
        case 'image': {
          const imageFile = new File(dir, `${screenName}.jpg`);
          const imageUrl = 'https://picsum.photos/200/300';
          await File.downloadFileAsync(imageUrl, imageFile, { idempotent: true });
          return imageFile;
        }
        case 'video': {
          const videoFile = new File(dir, `${screenName}.mp4`);
          const videoUrl =
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
          await File.downloadFileAsync(videoUrl, videoFile, { idempotent: true });
          return videoFile;
        }
      }
    } catch (e) {
      console.error('Error downloading file:', e);
      throw e;
    }
  };

  const renderAssetInfo = () => {
    if (!assetInfo || !asset) return null;
    return (
      <View style={styles.infoContainer}>
        <ScrollView
          style={styles.infoScrollView}
          contentContainerStyle={styles.infoScrollContent}
          showsVerticalScrollIndicator>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Asset ID:</Text> {asset.id}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>URI:</Text> {assetInfo.uri}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Filename:</Text> {assetInfo.filename}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Media Type:</Text> {assetInfo.mediaType}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Dimensions:</Text> {assetInfo.width} x {assetInfo.height}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Creation Time:</Text>
            {assetInfo.creationTime ? new Date(assetInfo.creationTime).toLocaleString() : 'N/A'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Modification Time:</Text>
            {assetInfo.modificationTime
              ? new Date(assetInfo.modificationTime).toLocaleString()
              : 'N/A'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Duration:</Text>
            {assetInfo.duration !== null ? `${assetInfo.duration} ms` : 'N/A'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Media Subtypes:</Text> {mediaSubtypes?.join(', ') || 'N/A'}
          </Text>
          {Platform.OS === 'ios' && (
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Orientation:</Text>{' '}
              {orientation !== undefined ? (orientation ?? 'N/A') : 'N/A'}
            </Text>
          )}
          {Platform.OS === 'ios' && (
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Is Network Asset:</Text>{' '}
              {isNetworkAsset !== undefined ? String(isNetworkAsset) : 'N/A'}
            </Text>
          )}
          {Platform.OS === 'ios' && (
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Paired Video URI:</Text>{' '}
              {pairedVideoUri !== undefined ? (pairedVideoUri ?? 'N/A') : 'N/A'}
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {testState === TestState.START && (
        <View style={styles.buttonGroup}>
          <Pressable style={styles.primaryButton} onPress={() => handleAddAsset('image')}>
            <Text style={styles.primaryButtonText}>Add Image</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => handleAddAsset('video')}>
            <Text style={styles.primaryButtonText}>Add Video</Text>
          </Pressable>
          {Platform.OS === 'ios' && Device.isDevice && (
            <Pressable style={styles.primaryButton} onPress={handleCheckLibraryForLivePhoto}>
              <Text style={styles.primaryButtonText}>Check Library for LivePhoto</Text>
            </Pressable>
          )}
        </View>
      )}

      {testState === TestState.LOADING && <ActivityIndicator size="large" color="#0000ff" />}
      {testState === TestState.FINISHED && (
        <>
          {isVideo ? (
            <VideoView player={player} style={styles.video} />
          ) : pairedVideoUri ? (
            <View style={styles.livePhotoContainer}>
              <Image source={{ uri: asset?.id }} style={styles.livePhotoImage} />
              <VideoView player={pairedVideoPlayer} style={styles.livePhotoVideo} />
            </View>
          ) : (
            <Image source={{ uri: asset?.id }} style={styles.image} />
          )}
          <View style={styles.buttonContainer}>
            <Pressable style={styles.deleteButton} onPress={handleDeleteAsset}>
              <Text style={styles.deleteButtonText}>Delete Asset</Text>
            </Pressable>
            {Platform.OS === 'ios' && (
              <Pressable style={styles.primaryButton} onPress={toggleFavorite}>
                <Text style={styles.primaryButtonText}>
                  {assetInfo?.isFavorite ? 'Unmark Favorite' : 'Mark Favorite'}
                </Text>
              </Pressable>
            )}
          </View>
          {renderAssetInfo()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: 200,
    height: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    marginVertical: 20,
    gap: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  statusText: {
    fontSize: 18,
    color: '#555',
  },
  infoContainer: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '100%',
    maxHeight: 260,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoScrollView: {
    width: '100%',
  },
  infoScrollContent: {
    padding: 15,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  video: {
    width: 300,
    height: 200,
  },
  livePhotoContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  livePhotoImage: {
    width: 160,
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  livePhotoVideo: {
    width: 160,
    height: 160,
  },
  bold: {
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    top: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AssetScreen;
