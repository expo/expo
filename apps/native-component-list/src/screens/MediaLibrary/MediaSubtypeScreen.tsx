import { Image } from 'expo-image';
import {
  AssetField,
  type AssetMetadata,
  MediaSubtype,
  Query,
  requestPermissionsAsync,
} from 'expo-media-library';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth / numColumns - 8;

const subtypes = Object.values(MediaSubtype);

const MediaSubtypeScreen = () => {
  const [assets, setAssets] = useState<AssetMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [subtype, setSubtype] = useState<MediaSubtype>(MediaSubtype.SCREENSHOT);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setAssets(
        await new Query()
          .contains(AssetField.MEDIA_SUBTYPES, subtype)
          .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
          .exeForMetadata()
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await requestPermissionsAsync();
      if (status === 'denied') {
        Alert.alert('Permission denied', 'Cannot proceed without media library permissions.');
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [subtype]);

  const cycleSubtype = () => {
    const nextIndex = (subtypes.indexOf(subtype) + 1) % subtypes.length;
    setSubtype(subtypes[nextIndex]);
  };

  const renderItem = ({ item }: { item: AssetMetadata }) => (
    <View style={styles.assetCard}>
      <Image source={{ uri: item.id }} style={styles.assetImage} />
      <Text style={styles.assetLabel} numberOfLines={1}>
        {item.filename}
      </Text>
      <Text style={styles.assetLabel} numberOfLines={1}>
        {item.mediaSubtypes?.join(', ')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.subtypeButton} onPress={cycleSubtype}>
        <Text style={styles.subtypeButtonText}>Subtype: {subtype}</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : assets.length === 0 ? (
        <Text style={styles.status}>No assets with subtype {subtype}</Text>
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
    paddingTop: 20,
  },
  status: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#666',
  },
  subtypeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  subtypeButtonText: {
    fontSize: 14,
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

export default MediaSubtypeScreen;
