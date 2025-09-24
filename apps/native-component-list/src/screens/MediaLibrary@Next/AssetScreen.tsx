import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { Asset, MediaType } from 'expo-media-library/next';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';

enum TestState {
  START = 'start',
  LOADING = 'loading',
  FINISHED = 'finished',
  ERROR = 'error',
}

const AssetScreen = () => {
  const screenName = 'asset_screen';
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assetInfo, setAssetInfo] = useState<{
    uri: string;
    height: number;
    width: number;
    filename: string;
    mediaType: MediaType;
    creationTime: number | null;
    modificationTime: number | null;
    duration: number | null;
  } | null>(null);

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

  const handleAddAsset = async (type: 'image' | 'video') => {
    setTestState(TestState.LOADING);
    try {
      const file = await downloadFile(type);
      const newAsset = await Asset.create(file.uri);
      setAsset(newAsset);
      setAssetInfo({
        uri: await newAsset.getUri(),
        height: await newAsset.getHeight(),
        width: await newAsset.getWidth(),
        filename: await newAsset.getFilename(),
        mediaType: await newAsset.getMediaType(),
        creationTime: await newAsset.getCreationTime(),
        modificationTime: await newAsset.getModificationTime(),
        duration: await newAsset.getDuration(),
      });
      setTestState(TestState.FINISHED);
    } catch (e) {
      console.error('Error adding asset:', e);
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {testState === TestState.START && (
        <View style={styles.buttonGroup}>
          <Pressable style={styles.addButton} onPress={() => handleAddAsset('image')}>
            <Text style={styles.addButtonText}>Add Image</Text>
          </Pressable>
          <Pressable style={styles.addButton} onPress={() => handleAddAsset('video')}>
            <Text style={styles.addButtonText}>Add Video</Text>
          </Pressable>
        </View>
      )}

      {testState === TestState.LOADING && <ActivityIndicator size="large" color="#0000ff" />}
      {testState === TestState.FINISHED && (
        <>
          {isVideo ? (
            <VideoView player={player} style={styles.video} />
          ) : (
            <Image source={{ uri: asset?.id }} style={styles.image} />
          )}
          <View style={styles.buttonContainer}>
            <Pressable style={styles.deleteButton} onPress={handleDeleteAsset}>
              <Text style={styles.deleteButtonText}>Delete Asset</Text>
            </Pressable>
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
    width: '60%',
  },
  statusText: {
    fontSize: 18,
    color: '#555',
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  bold: {
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '90%',
    position: 'absolute',
    top: 40,
  },
  addButton: {
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
  addButtonText: {
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
