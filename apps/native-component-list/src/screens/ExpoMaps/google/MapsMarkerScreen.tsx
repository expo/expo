import { GoogleMaps } from 'expo-maps';
import { useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';

const MARKERS: GoogleMaps.Marker[] = [
  {
    id: 'marker-1',
    coordinates: { latitude: 50, longitude: 10 },
    title: 'Marker #1',
    snippet: 'You can drag me!',
    draggable: true,
  },
  {
    id: 'marker-2',
    coordinates: { latitude: 51, longitude: 9 },
    title: 'Marker #2',
    snippet: 'Second marker',
  },
  {
    id: 'marker-3',
    coordinates: { latitude: 49, longitude: 11 },
    title: 'Marker #3',
    snippet: 'Third marker',
  },
  {
    id: 'marker-4',
    coordinates: { latitude: 51, longitude: 10 },
    title: 'Marker #4',
    snippet: 'Fourth marker',
  },
  {
    id: 'marker-5',
    coordinates: { latitude: 49, longitude: 9 },
    title: 'Marker #5',
    snippet: 'Fifth marker',
  },
];

export default function MapsMarkerScreen() {
  const mapRef = useRef<GoogleMaps.MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleMarkerSelect = (markerId: string) => {
    const newId = selectedId === markerId ? null : markerId;
    mapRef.current?.select(newId, { moveCamera: true });
  };

  const clearSelection = () => {
    setSelectedId(null);
    mapRef.current?.select(null);
  };

  return (
    <View style={styles.container}>
      <GoogleMaps.View
        ref={mapRef}
        style={styles.map}
        cameraPosition={{
          coordinates: {
            latitude: 50,
            longitude: 10,
          },
          zoom: 7,
        }}
        markers={MARKERS}
        onMarkerClick={(marker) => {
          setSelectedId(marker.id ?? null);
        }}
        onDeselect={() => {
          setSelectedId(null);
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
            const isSelected = selectedId === item.id;
            return (
              <Pressable
                style={[styles.markerItem, isSelected && styles.markerItemSelected]}
                onPress={() => handleMarkerSelect(item.id!)}>
                <View style={[styles.markerDot, { backgroundColor: '#4285F4' }]} />
                <Text style={[styles.markerTitle, isSelected && styles.markerTitleSelected]}>
                  {item.title}
                </Text>
              </Pressable>
            );
          }}
        />
        {selectedId && (
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
    borderColor: '#4285F4',
    backgroundColor: '#e8f0fe',
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
    color: '#4285F4',
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
