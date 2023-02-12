import * as Maps from 'expo-maps';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import ProviderContext from '../context/ProviderContext';

export default function PolylinesExample() {
  const provider = useContext(ProviderContext);
  return (
    <View style={styles.container}>
      <Maps.ExpoMap style={{ flex: 1, width: '100%' }} provider={provider}>
        <Maps.Circle
          center={{ latitude: 51.5, longitude: -0.13 }}
          radius={100000}
          strokeWidth={1}
          fillColor="#00FF00A0"
          strokeColor="#FF0000"
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
