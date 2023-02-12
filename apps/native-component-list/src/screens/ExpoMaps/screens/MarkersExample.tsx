import * as Maps from 'expo-maps';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import ProviderContext from '../context/ProviderContext';

export default function MarkerExample() {
  const provider = useContext(ProviderContext);

  return (
    <View style={styles.container}>
      <Maps.ExpoMap style={{ flex: 1, width: '100%' }} provider={provider}>
        <Maps.Marker
          latitude={48.85}
          longitude={2.35}
          markerTitle="Paris"
          markerSnippet="You can choose custom marker colors!"
          color="blue"
        />
        <Maps.Marker
          latitude={44}
          longitude={3}
          markerTitle="Building"
          markerSnippet="You can use custom marker icons!"
          icon={require('../../../../assets/expo-maps/building.png')}
        />
        <Maps.Marker
          latitude={40.4}
          longitude={-3.7}
          markerTitle="Madrid"
          markerSnippet="I'm dragable"
          draggable
          color="green"
        />
        <Maps.Marker
          latitude={51.5}
          longitude={-0.13}
          markerTitle="London"
          markerSnippet="I'm semi transparent!"
          opacity={0.5}
        />
        <Maps.Cluster
          name="sample_cluster_group"
          minimumClusterSize={2}
          color="purple"
          opacity={0.5}
          markerTitle="Cluster"
          markerSnippet="Zoom in to see particular markers">
          <Maps.Marker latitude={50} longitude={10} />
          <Maps.Marker latitude={51} longitude={10} />
          <Maps.Marker latitude={52} longitude={10.15} />
          <Maps.Marker latitude={52} longitude={9.85} />
        </Maps.Cluster>
      </Maps.ExpoMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
