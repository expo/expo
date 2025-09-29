import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { Asset, Album, requestPermissionsAsync } from 'expo-media-library/next';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';

enum TestState {
  ADD_ALBUM = 'addAlbum',
  ADDING_ALBUM = 'addingAlbum',
  CREATING_ASSET = 'creatingAsset',
  ADD_ASSET_TO_GALLERY = 'addAssetToGallery',
  ADDING_ASSET_TO_ALBUM = 'addingAssetToAlbum',
  ERROR = 'error',
}

type AssetInfo = {
  id: string;
  uri: string | null;
};

const AddAssetToAlbumScreen = () => {
  const screenName = 'asset_album_screen';
  const [album, setAlbum] = useState<Album | null>(null);
  const [albumAssetsInfo, setAlbumAssetsInfo] = useState<AssetInfo[]>([]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assetUri, setAssetUri] = useState<string | null>(null);
  const [testState, setTestState] = useState<TestState>(TestState.ADD_ALBUM);

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

  const downloadFile = async (type: 'image' | 'video'): Promise<File> => {
    const dir = new Directory(Paths.cache, screenName);
    dir.create({ idempotent: true });
    const file = new File(dir, type === 'image' ? `${screenName}.jpg` : `${screenName}.mp4`);
    const url =
      type === 'image'
        ? 'https://picsum.photos/200/300'
        : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
    await File.downloadFileAsync(url, file, { idempotent: true });
    return file;
  };

  const createAlbum = async () => {
    try {
      setTestState(TestState.ADDING_ALBUM);
      const file = await downloadFile('image');
      const initialAsset = await Asset.create(file.uri);
      const newAlbum = await Album.create('My_Sample_Album', [initialAsset]);
      if (!newAlbum) {
        setTestState(TestState.ERROR);
        return;
      }
      const assetsInAlbum = await newAlbum.getAssets();

      setAlbum(newAlbum);
      const assetsInAlbumWithUri = await Promise.all(
        assetsInAlbum.map(async (asset) => {
          const uri = await asset.getUri();
          return { id: asset.id, uri };
        })
      );
      setAlbumAssetsInfo(assetsInAlbumWithUri);
      setTestState(TestState.ADD_ASSET_TO_GALLERY);
    } catch (e) {
      console.error(e);
      setTestState(TestState.ERROR);
    }
  };

  const addAssetToGallery = async (type: 'image' | 'video') => {
    try {
      setTestState(TestState.CREATING_ASSET);
      const file = await downloadFile(type);
      const newAsset = await Asset.create(file.uri);
      const newAssetUri = await newAsset.getUri();

      setAsset(newAsset);
      setAssetUri(newAssetUri);
      setTestState(TestState.ADD_ASSET_TO_GALLERY);
    } catch (e) {
      console.error(e);
      setTestState(TestState.ERROR);
    }
  };

  const addAssetToAlbum = async () => {
    if (album && asset) {
      try {
        await album.add(asset);
        const updatedAssets = await album.getAssets();
        const updatedAssetsWithUri: AssetInfo[] = await Promise.all(
          updatedAssets.map(async (asset) => {
            const uri = await asset.getUri();
            return { id: asset.id, uri };
          })
        );
        setAsset(null);
        setAssetUri(null);
        setAlbumAssetsInfo(updatedAssetsWithUri);
        setTestState(TestState.ADD_ASSET_TO_GALLERY);
      } catch (e) {
        console.error(e);
        setTestState(TestState.ERROR);
      }
    }
  };

  const deleteAlbum = async () => {
    if (album) {
      try {
        await album.delete();
        setAlbum(null);
        setAlbumAssetsInfo([]);
        setAsset(null);
        setAssetUri(null);
        setTestState(TestState.ADD_ALBUM);
      } catch (e) {
        console.error(e);
        setTestState(TestState.ERROR);
      }
    }
  };

  const AssetCard = ({ item }: { item: AssetInfo }) => (
    <View style={styles.assetCard}>
      <Image source={{ uri: item.id ?? '' }} style={styles.assetThumbnail} />
      <View style={styles.contentWrapper}>
        <Text style={styles.assetUriText}>{item.uri}</Text>
      </View>
    </View>
  );

  const renderAddAlbum = () => (
    <Pressable style={styles.primaryButton} onPress={createAlbum}>
      <Text style={styles.primaryButtonText}>Add Album</Text>
    </Pressable>
  );

  const renderAddAssetToGallery = () => (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Add Asset to Gallery</Text>
      <View style={styles.addAssetToGalleryRow}>
        <Pressable
          style={[
            styles.secondaryButton,
            testState === TestState.CREATING_ASSET && styles.disabledButton,
          ]}
          onPress={() => addAssetToGallery('image')}
          disabled={testState === TestState.CREATING_ASSET}>
          <Text style={styles.secondaryButtonText}>Add Photo </Text>
        </Pressable>
        <Pressable
          style={[
            styles.secondaryButton,
            testState === TestState.CREATING_ASSET && styles.disabledButton,
          ]}
          onPress={() => addAssetToGallery('video')}
          disabled={testState === TestState.CREATING_ASSET}>
          <Text style={styles.secondaryButtonText}>Add Video </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderAssetSection = () =>
    asset ? (
      <View style={[styles.section]}>
        <AssetCard item={{ id: asset.id, uri: assetUri }} />
        <Pressable
          style={[styles.orangeButton, !asset && styles.disabledButton]}
          onPress={addAssetToAlbum}>
          <Text style={styles.secondaryButtonText}>Add This Asset to the Album</Text>
        </Pressable>
      </View>
    ) : null;

  const renderAlbumAssets = () => (
    <View style={[styles.section, styles.contentWrapper]}>
      <Text style={styles.sectionHeader}>Album Assets</Text>
      <FlatList
        data={[...albumAssetsInfo].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AssetCard item={item} />}
        style={styles.contentWrapper}
      />
      <Pressable style={styles.deleteButton} onPress={deleteAlbum}>
        <Text style={styles.deleteButtonText}>Delete Album</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {testState === TestState.ERROR && <Text>Error occurred</Text>}
      {testState === TestState.ADD_ALBUM && renderAddAlbum()}
      {testState === TestState.ADDING_ALBUM && <ActivityIndicator size="large" color="#0000ff" />}
      {album && (
        <View style={styles.contentWrapper}>
          {renderAddAssetToGallery()}
          {testState === TestState.CREATING_ASSET && (
            <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 20 }} />
          )}
          {asset && testState !== TestState.CREATING_ASSET && renderAssetSection()}
          {renderAlbumAssets()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', width: '100%' },
  contentWrapper: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { fontSize: 22, fontWeight: '700', marginVertical: 12, color: '#333' },
  section: {
    padding: 15,
    marginVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addAssetToGalleryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sectionHeader: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#333' },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  assetThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  assetUriText: { fontSize: 12, color: '#444' },
  statusText: { fontSize: 18, color: '#555', marginTop: 20, textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 10,
    alignSelf: 'center',
    minWidth: '60%',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  secondaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 5,
    alignSelf: 'stretch',
  },
  secondaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  orangeButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 10,
    alignSelf: 'stretch',
  },
  disabledButton: { backgroundColor: '#ccc' },
  deleteButton: {
    backgroundColor: '#E53935',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});

export default AddAssetToAlbumScreen;
