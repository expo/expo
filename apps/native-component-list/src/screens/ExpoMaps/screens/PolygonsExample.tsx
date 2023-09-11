import * as Maps from 'expo-maps';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import ProviderContext from '../context/ProviderContext';

export default function PolygonsExample() {
  const provider = useContext(ProviderContext);
  return (
    <View style={styles.container}>
      <Maps.ExpoMap style={{ flex: 1, width: '100%' }} provider={provider}>
        <Maps.Polygon
          points={[
            { latitude: 52, longitude: 13 },
            { latitude: 47, longitude: 11 },
            { latitude: 63, longitude: 4 },
            { latitude: 49, longitude: 22 },
          ]}
        />
        <Maps.Polygon
          points={[
            { latitude: 39, longitude: 3 },
            { latitude: 33, longitude: 2 },
            { latitude: 44, longitude: 22 },
          ]}
          strokeWidth={4}
          fillColor="purple"
          strokeColor="#FF0000"
        />
        <Maps.Polygon
          points={[
            { latitude: 65, longitude: -5 },
            { latitude: 37, longitude: -11 },
            { latitude: 47, longitude: 5 },
          ]}
          strokePattern={[
            { type: 'stroke', length: 20 },
            { type: 'gap', length: 10 },
          ]}
        />
      </Maps.ExpoMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
