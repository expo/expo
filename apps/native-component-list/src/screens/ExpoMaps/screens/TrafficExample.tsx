import * as Maps from 'expo-maps';
import React, { useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import SwitchContainer from '../components/SwitchContainer';
import ProviderContext from '../context/ProviderContext';

export default function TrafficExample() {
  const provider = useContext(ProviderContext);

  const [showTraffic, setShowTraffic] = useState<boolean>(false);

  return (
    <View style={styles.mapContainer}>
      <Maps.ExpoMap
        style={{ flex: 1, width: '100%' }}
        provider={provider}
        enableTraffic={showTraffic}
      />
      <View style={styles.switchContainer}>
        <SwitchContainer
          title="Show traffic"
          value={showTraffic}
          onValueChange={() => setShowTraffic(!showTraffic)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  switchContainer: {
    padding: 20,
  },
});
