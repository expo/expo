import { GoogleMaps } from 'expo-maps-remake';
import React from 'react';
import { View } from 'react-native';

import ConsoleBox from '../../../components/ConsoleBox';

export default function MapsEventsScreen() {
  const [lastEvent, setLastEvent] = React.useState<string>('');

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
          }}
          markers={[
            {
              coordinates: {
                latitude: 37.78825,
                longitude: -122.4324,
              },
              title: 'San Francisco',
            },
          ]}
        />
      </View>
      <View>
        <ConsoleBox style={{ margin: 10 }}>{lastEvent}</ConsoleBox>
      </View>
    </View>
  );
}
