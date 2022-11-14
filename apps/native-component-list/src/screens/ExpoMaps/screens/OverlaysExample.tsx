import * as Maps from 'expo-maps';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import ProviderContext from '../context/ProviderContext';

export default function OverlaysExample() {
  const provider = useContext(ProviderContext);
  return (
    <View style={styles.container}>
      <Maps.ExpoMap
        style={styles.map}
        provider={provider}
        initialCameraPosition={{
          target: {
            latitude: 40.7357,
            longitude: -74.1724,
          },
          zoom: 12,
        }}>
        <Maps.Overlay
          bounds={{
            southWest: { latitude: 40.712216, longitude: -74.22655 },
            northEast: { latitude: 40.773941, longitude: -74.12544 },
          }}
          icon={require('../../../../assets/expo-maps/newark_nj_1922.jpeg')}
        />
      </Maps.ExpoMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
  },
});
