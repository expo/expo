import { Coordinates, GoogleMaps } from 'expo-maps';
import React from 'react';
import { Text, View } from 'react-native';

import ConsoleBox from '../../../components/ConsoleBox';

const SAMPLE_MARKERS = [
  { coordinates: { latitude: 37.78825, longitude: -122.4324 }, title: 'San Francisco' },
  { coordinates: { latitude: 37.8044, longitude: -122.2712 }, title: 'Oakland' },
  { coordinates: { latitude: 37.3382, longitude: -121.8863 }, title: 'San Jose' },
  { coordinates: { latitude: 38.5816, longitude: -121.4944 }, title: 'Sacramento' },
  { coordinates: { latitude: 36.7783, longitude: -119.4179 }, title: 'Fresno' },
];

function isInViewport(
  marker: Coordinates,
  center: Coordinates,
  latitudeDelta: number,
  longitudeDelta: number
) {
  if (
    marker.latitude == null ||
    marker.longitude == null ||
    center.latitude == null ||
    center.longitude == null
  ) {
    return false;
  }
  const halfLat = latitudeDelta / 2;
  const halfLng = longitudeDelta / 2;
  return (
    marker.latitude >= center.latitude - halfLat &&
    marker.latitude <= center.latitude + halfLat &&
    marker.longitude >= center.longitude - halfLng &&
    marker.longitude <= center.longitude + halfLng
  );
}

export default function MapsEventsScreen() {
  const [lastEvent, setLastEvent] = React.useState<string>('');
  const [visibleCount, setVisibleCount] = React.useState<number | null>(null);
  const [viewportSize, setViewportSize] = React.useState<string>('—');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <GoogleMaps.View
          style={{ width: 'auto', height: '100%' }}
          cameraPosition={{
            coordinates: {
              latitude: 37.78825,
              longitude: -122.4324,
            },
            zoom: 8,
          }}
          onMapLoaded={() => {
            setLastEvent(JSON.stringify({ type: 'onMapLoaded' }, null, 2));
          }}
          onMapClick={(e) => {
            setLastEvent(JSON.stringify({ type: 'onMapClick', data: e }, null, 2));
          }}
          onMapLongClick={(e) => {
            setLastEvent(JSON.stringify({ type: 'onMapLongClick', data: e }, null, 2));
          }}
          onPOIClick={(e) => {
            setLastEvent(JSON.stringify({ type: 'onPOIClick', data: e }, null, 2));
          }}
          onMarkerClick={(e) => {
            setLastEvent(JSON.stringify({ type: 'onMarkerClick', data: e }, null, 2));
          }}
          onCameraMove={(e) => {
            setLastEvent(JSON.stringify({ type: 'onCameraMove', data: e }, null, 2));

            const count = SAMPLE_MARKERS.filter((m) =>
              isInViewport(m.coordinates, e.coordinates, e.latitudeDelta, e.longitudeDelta)
            ).length;
            setVisibleCount(count);
            setViewportSize(`${e.latitudeDelta.toFixed(3)}° × ${e.longitudeDelta.toFixed(3)}°`);
          }}
          markers={SAMPLE_MARKERS}
        />
      </View>
      <View style={{ paddingHorizontal: 10, paddingTop: 10 }}>
        <Text>Viewport size: {viewportSize}</Text>
        <Text>
          Markers in viewport: {visibleCount ?? '—'} / {SAMPLE_MARKERS.length}
        </Text>
      </View>
      <View>
        <ConsoleBox style={{ margin: 10 }}>{lastEvent}</ConsoleBox>
      </View>
    </View>
  );
}
