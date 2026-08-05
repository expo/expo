import { AppleMaps } from 'expo-maps';
import { useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';

const MARKERS: AppleMaps.Marker[] = [
  {
    id: 'marker-1',
    coordinates: { latitude: 50, longitude: 10 },
    title: 'Marker #1',
    monogram: '1',
    tintColor: 'blue',
  },
  {
    id: 'marker-2',
    coordinates: { latitude: 51, longitude: 9 },
    title: 'Marker #2',
    tintColor: 'green',
    systemImage: 'person',
  },
  {
    id: 'marker-3',
    coordinates: { latitude: 49, longitude: 11 },
    title: 'Marker #3',
    tintColor: 'black',
    systemImage: 'arrowshape.up.circle',
  },
  {
    id: 'marker-4',
    coordinates: { latitude: 51, longitude: 10 },
    title: 'Marker #4',
    tintColor: 'purple',
    systemImage: 'play.circle',
  },
  {
    id: 'marker-5',
    coordinates: { latitude: 49, longitude: 9 },
    title: 'Marker #5',
    tintColor: 'orange',
    systemImage: 'figure.walk.circle',
  },
];

export default function MapsMarkerScreen() {
  const mapRef = useRef<AppleMaps.MapView>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string>();

  const handleMarkerSelect = (markerId: string) => {
    mapRef.current?.selectMarker(markerId, { moveCamera: true });
  };

  const clearSelection = () => {
    setSelectedMarkerId(undefined);
    mapRef.current?.selectMarker();
  };

  const onMarkerClick = (marker: AppleMaps.Marker) => {
    setSelectedMarkerId(marker.id);
  };

  const onMapClick = () => {
    setSelectedMarkerId(undefined);
  };

  return (
    <View style={styles.container}>
      <AppleMaps.View
        ref={mapRef}
        style={styles.map}
        cameraPosition={{
          coordinates: {
            latitude: 50,
            longitude: 10,
          },
          zoom: 7,
        }}
        colorScheme={AppleMaps.MapColorScheme.DARK}
        markers={MARKERS}
        onMarkerClick={onMarkerClick}
        onMapClick={onMapClick}
        properties={{
          selectionEnabled: false,
        }}
      />

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Select a marker (via ref):</Text>
        <FlatList
          data={MARKERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedMarkerId === item.id;
            return (
              <Pressable
                style={[styles.markerItem, isSelected && styles.markerItemSelected]}
                onPress={() => handleMarkerSelect(item.id!)}>
                <View
                  style={[styles.markerDot, { backgroundColor: item.tintColor || '#007AFF' }]}
                />
                <Text style={[styles.markerTitle, isSelected && styles.markerTitleSelected]}>
                  {item.title}
                </Text>
              </Pressable>
            );
          }}
        />
        {selectedMarkerId && (
          <Pressable style={styles.clearButton} onPress={clearSelection}>
            <Text style={styles.clearButtonText}>Clear Selection</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  listContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e4e8',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#586069',
    marginLeft: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  markerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e1e4e8',
  },
  markerItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e7f3ff',
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  markerTitle: {
    fontSize: 14,
    color: '#24292e',
    fontWeight: '500',
  },
  markerTitleSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#dc3545',
    borderRadius: 16,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
