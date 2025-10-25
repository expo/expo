import { Image } from 'expo-image';
import { Query, Asset, requestPermissionsAsync } from 'expo-media-library/next';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth / numColumns - 12;

const GranularPermissionsScreen = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const assets = await new Query().exe();
      setAssets(assets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const requestPermissionAndFetch = async (type: 'photo' | 'video') => {
    try {
      await requestPermissionsAsync(false, [type]);
      fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: { item: Asset }) => (
    <View style={styles.assetCard}>
      <Image source={{ uri: item.id }} style={styles.assetImage} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.buttonGroup}>
        <Pressable
          style={styles.permissionButton}
          onPress={() => requestPermissionAndFetch('photo')}>
          <Text style={styles.permissionButtonText}>Request Image Permission</Text>
        </Pressable>
        <Pressable
          style={styles.permissionButton}
          onPress={() => requestPermissionAndFetch('video')}>
          <Text style={styles.permissionButtonText}>Request Video Permission</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : assets.length === 0 ? (
        <Text style={styles.statusText}>The gallery is empty</Text>
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
    backgroundColor: '#f5f5f5',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginTop: 40,
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: 6,
    paddingBottom: 20,
  },
  assetCard: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  assetImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
});

export default GranularPermissionsScreen;
