import { AppleMaps } from 'expo-maps';
import { useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';

const ANNOTATIONS: AppleMaps.Annotation[] = [
  {
    id: 'windsor',
    coordinates: { latitude: 51.38494, longitude: -0.41944 },
    title: 'Windsor',
    text: 'W',
    textColor: 'white',
    backgroundColor: '#e74c3c',
  },
  {
    id: 'reading',
    coordinates: { latitude: 51.454514, longitude: -0.97813 },
    title: 'Reading',
    text: 'R',
    textColor: 'white',
    backgroundColor: '#27ae60',
  },
  {
    id: 'canterbury',
    coordinates: { latitude: 51.280233, longitude: 1.080775 },
    title: 'Canterbury',
    text: 'C',
    textColor: 'white',
    backgroundColor: '#3498db',
  },
  {
    id: 'oxford',
    coordinates: { latitude: 51.75, longitude: -1.257778 },
    title: 'Oxford',
    text: 'O',
    textColor: 'black',
    backgroundColor: '#f1c40f',
  },
  {
    id: 'westminster',
    coordinates: { latitude: 51.509865, longitude: -0.118092 },
    title: 'Westminster',
    text: 'WM',
    textColor: 'white',
    backgroundColor: '#9b59b6',
  },
];

export default function MapsAnnotationsScreen() {
  const mapRef = useRef<AppleMaps.MapView>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string>();

  const handleAnnotationSelect = (annotationId: string) => {
    mapRef.current?.selectItem(annotationId);
  };

  const clearSelection = () => {
    setSelectedAnnotationId(undefined);
    mapRef.current?.selectItem();
  };

  const onAnnotationClick = (annotation: AppleMaps.Annotation) => {
    setSelectedAnnotationId(annotation.id);
  };

  const onMapClick = () => {
    setSelectedAnnotationId(undefined);
  };

  return (
    <View style={styles.container}>
      <AppleMaps.View
        ref={mapRef}
        style={styles.map}
        cameraPosition={{
          coordinates: {
            latitude: 51.509865,
            longitude: -0.1275,
          },
          zoom: 7,
        }}
        annotations={ANNOTATIONS}
        onAnnotationClick={onAnnotationClick}
        onMapClick={onMapClick}
        properties={{
          selectionEnabled: true,
        }}
      />

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Select an annotation (via ref):</Text>
        <FlatList
          data={ANNOTATIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedAnnotationId === item.id;
            return (
              <Pressable
                style={[styles.annotationItem, isSelected && styles.annotationItemSelected]}
                onPress={() => handleAnnotationSelect(item.id!)}>
                <View style={[styles.annotationDot, { backgroundColor: item.backgroundColor }]} />
                <Text
                  style={[styles.annotationTitle, isSelected && styles.annotationTitleSelected]}>
                  {item.title}
                </Text>
              </Pressable>
            );
          }}
        />
        {selectedAnnotationId && (
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
  annotationItem: {
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
  annotationItemSelected: {
    borderColor: '#9b59b6',
    backgroundColor: '#f3e5f5',
  },
  annotationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  annotationTitle: {
    fontSize: 14,
    color: '#24292e',
    fontWeight: '500',
  },
  annotationTitleSelected: {
    color: '#9b59b6',
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
