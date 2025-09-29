import { Image } from 'expo-image';
import { MediaType, requestPermissionsAsync, Query, AssetField } from 'expo-media-library/next';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth / numColumns - 8;

type AssetInfo = {
  id: string;
  height: number;
  width: number;
  mediaType: MediaType;
  creationTime: number | null;
  modificationTime: number | null;
  duration: number | null;
};

const sortFields: AssetField[] = [
  AssetField.CREATION_TIME,
  AssetField.MODIFICATION_TIME,
  AssetField.MEDIA_TYPE,
  AssetField.HEIGHT,
  AssetField.WIDTH,
  AssetField.DURATION,
];

const sortLabels: Record<AssetField, string> = {
  [AssetField.CREATION_TIME]: 'Creation Time',
  [AssetField.MODIFICATION_TIME]: 'Modification Time',
  [AssetField.MEDIA_TYPE]: 'Media Type',
  [AssetField.HEIGHT]: 'Height',
  [AssetField.WIDTH]: 'Width',
  [AssetField.DURATION]: 'Duration',
};

const SortScreen = () => {
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortingBy, setSortingBy] = useState<AssetField>(AssetField.CREATION_TIME);
  const [ascending, setAscending] = useState<boolean>(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const rawAssets = await new Query()
        .within(AssetField.MEDIA_TYPE, [MediaType.IMAGE, MediaType.VIDEO])
        .orderBy({ key: sortingBy, ascending })
        .exe();
      const assetInfos = await Promise.all(
        rawAssets.map(async (asset) => ({
          id: asset.id,
          height: await asset.getHeight(),
          width: await asset.getWidth(),
          mediaType: await asset.getMediaType(),
          creationTime: await asset.getCreationTime(),
          modificationTime: await asset.getModificationTime(),
          duration: await asset.getDuration(),
        }))
      );
      setAssets(assetInfos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestPermissionsAsync();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [sortingBy, ascending]);

  const renderItem = ({ item }: { item: AssetInfo }) => (
    <View style={styles.assetCard}>
      <Image source={{ uri: item.id }} style={styles.assetImage} />
      {(() => {
        switch (sortingBy) {
          case AssetField.CREATION_TIME:
            return (
              <Text style={styles.assetLabel} numberOfLines={1}>
                {item.creationTime ? new Date(item.creationTime).toLocaleDateString() : 'N/A'}
              </Text>
            );
          case AssetField.MODIFICATION_TIME:
            return (
              <Text style={styles.assetLabel} numberOfLines={1}>
                {item.modificationTime
                  ? new Date(item.modificationTime).toLocaleDateString()
                  : 'N/A'}
              </Text>
            );
          case AssetField.HEIGHT:
            return (
              <Text style={styles.assetLabel} numberOfLines={1}>
                {item.height}px
              </Text>
            );
          case AssetField.WIDTH:
            return (
              <Text style={styles.assetLabel} numberOfLines={1}>
                {item.width}px
              </Text>
            );
          case AssetField.DURATION:
            return (
              <Text style={styles.assetLabel} numberOfLines={1}>
                {item.duration ? `${Math.round(item.duration)}ms` : 'N/A'}
              </Text>
            );
          case AssetField.MEDIA_TYPE:
            return (
              <Text style={styles.assetLabel} numberOfLines={1}>
                {item.mediaType}
              </Text>
            );

          default:
            return null;
        }
      })()}
    </View>
  );

  const cycleSortField = () => {
    const currentIndex = sortFields.indexOf(sortingBy);
    const nextIndex = (currentIndex + 1) % sortFields.length;
    setSortingBy(sortFields[nextIndex]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortButton} onPress={cycleSortField}>
          <Text style={styles.sortButtonText}>Sort by: {sortLabels[sortingBy]}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sortButton} onPress={() => setAscending((prev) => !prev)}>
          <Text style={styles.sortButtonText}>{ascending ? 'ASC ↑' : 'DESC ↓'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : assets.length === 0 ? (
        <Text style={styles.status}>The gallery is empty</Text>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 20,
  },
  status: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#666',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sortButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: 4,
  },
  assetCard: {
    flex: 1,
    margin: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  assetImage: {
    width: imageSize,
    height: imageSize,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#eee',
  },
  assetLabel: {
    fontSize: 12,
    color: '#444',
    padding: 4,
  },
});

export default SortScreen;
