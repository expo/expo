import { AppleMaps } from 'expo-maps';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { flightPaths } from '../data';

const colors = ['#e74c3c', '#2ecc71', '#3498db'];

export default function MapsGeodesicPolylineScreen() {
  const [showGeodesic, setShowGeodesic] = useState(true);
  const [showStraight, setShowStraight] = useState(true);

  const geodesicPolylines = flightPaths.map((path, i) => ({
    id: `geodesic-${path.name}`,
    coordinates: path.coordinates,
    color: colors[i % colors.length],
    width: 3,
    contourStyle: AppleMaps.ContourStyle.GEODESIC,
  }));

  const straightPolylines = flightPaths.map((path, i) => ({
    id: `straight-${path.name}`,
    coordinates: path.coordinates,
    color: colors[i % colors.length],
    width: 2,
    contourStyle: AppleMaps.ContourStyle.STRAIGHT,
  }));

  const polylines = [
    ...(showGeodesic ? geodesicPolylines : []),
    ...(showStraight ? straightPolylines : []),
  ];

  return (
    <View style={styles.container}>
      <AppleMaps.View
        style={styles.map}
        cameraPosition={{
          coordinates: { latitude: 45, longitude: -30 },
          zoom: 3,
        }}
        properties={{
          polylineTapThreshold: 50_000,
        }}
        onPolylineClick={(event) => {
          Alert.alert('Polyline clicked', JSON.stringify(event, null, 2));
        }}
        polylines={polylines}
      />
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, showGeodesic && styles.buttonActive]}
          onPress={() => setShowGeodesic((v) => !v)}>
          <Text style={styles.buttonText}>Geodesic {showGeodesic ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, showStraight && styles.buttonActive]}
          onPress={() => setShowStraight((v) => !v)}>
          <Text style={styles.buttonText}>Straight {showStraight ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Flight paths:</Text>
        {flightPaths.map((path, i) => (
          <Text key={path.name} style={[styles.legendItem, { color: colors[i % colors.length] }]}>
            {path.name}
          </Text>
        ))}
        <Text style={styles.legendHint}>
          {showGeodesic && showStraight
            ? 'Geodesic lines curve along great circles; straight lines cut across the projection'
            : showGeodesic
              ? 'Showing geodesic (curved) lines only'
              : showStraight
                ? 'Showing straight lines only'
                : 'Toggle lines above'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    top: 60,
    right: 12,
    gap: 8,
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonActive: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 40,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 12,
  },
  legendTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  legendItem: {
    fontWeight: '600',
    fontSize: 13,
  },
  legendHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  },
});
