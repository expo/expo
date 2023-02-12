import * as Maps from 'expo-maps';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import ProviderContext from '../context/ProviderContext';

export default function HeatmapExample() {
  const provider = useContext(ProviderContext);

  return (
    <View style={styles.container}>
      <Maps.ExpoMap style={{ flex: 1, width: '100%' }} provider={provider}>
        <Maps.Heatmap
          points={require('../../../../assets/expo-maps/points.json')}
          radius={20}
          gradient={{ colors: ['#12345600', '#abcdef'], locations: [0, 1] }}
        />
        <Maps.Heatmap
          points={require('../../../../assets/expo-maps/pointsWithData.json')}
          radius={50}
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
