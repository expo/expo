import * as Maps from 'expo-maps';
import { LocationChangePriority } from 'expo-maps/src/Common.types';
import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Platform } from 'react-native';
import { Snackbar } from 'react-native-paper';

import SwitchContainer from '../components/SwitchContainer';
import ProviderContext from '../context/ProviderContext';

export default function CallbacksExample() {
  const provider = useContext(ProviderContext);

  const [onMapLoadedEnabled, setOnMapLoadedEnabled] = useState(true);
  const [onMapPressEnabled, setOnMapPressEnabled] = useState(true);
  const [onDoublePressEnabled, setOnDoublePressEnabled] = useState(true);
  const [onLongPressEnabled, setOnLongPressEnabled] = useState(true);
  const [onRegionChangeEnabled, setOnRegionChangeEnabled] = useState(false);
  const [onRegionChangeStartedEnable, setOnRegionChangeStartedEnabled] = useState(false);
  const [onRegionChangeCmpEnabled, setOnRegChangeCmpEnabled] = useState(false);
  const [onPoiClickEnabled, setOnPoiClickEnabled] = useState(true);
  const [onMarkerPressEnabled, setOnMarkerPressEnabled] = useState(true);
  const [onMarkerDragEnabled, setOnMarkerDragEnabled] = useState(false);
  const [onMarkerDragStartedEnabled, setOnMarkerDragStartedEnabled] = useState(true);
  const [onMarkerDragCompleteEnabled, setOnMarkerDragCompleteEnabled] = useState(true);
  const [onClusterPressEnabled, setOnClusterPressEnabled] = useState(true);
  const [onLocationButtonPressEnabled, setOnLocationButtonPressEnabled] = useState(true);
  const [onLocationDotPressEnabled, setOnLocationDotPressEnabled] = useState(true);
  const [onLocationChangeEnabled, setOnLocationChangeEnabled] = useState(false);

  const [snackbarText, setSnackbarText] = useState<string | undefined>(undefined);

  const [latitude] = useState<number>(40.4);
  const [longitude] = useState<number>(-3.7);

  const callbacksData = [
    {
      title: 'Enable onMapLoaded event',
      value: onMapLoadedEnabled,
      onValueChange: () => {
        setOnMapLoadedEnabled(!onMapLoadedEnabled);
      },
    },
    {
      title: 'Enable onMapPress event',
      value: onMapPressEnabled,
      onValueChange: () => {
        setOnMapPressEnabled(!onMapPressEnabled);
      },
    },
    {
      title: 'Enable onDoublePress event',
      value: onDoublePressEnabled,
      onValueChange: () => {
        setOnDoublePressEnabled(!onDoublePressEnabled);
      },
      enabled: provider === 'apple',
    },

    {
      title: 'Enable onLongPress event',
      value: onLongPressEnabled,
      onValueChange: () => {
        setOnLongPressEnabled(!onLongPressEnabled);
      },
    },
    {
      title: 'Enable onRegionChange event',
      value: onRegionChangeEnabled,
      onValueChange: () => {
        setOnRegionChangeEnabled(!onRegionChangeEnabled);
      },
    },
    {
      title: 'Enable onRegionChangeStarted event',
      value: onRegionChangeStartedEnable,
      onValueChange: () => {
        setOnRegionChangeStartedEnabled(!onRegionChangeStartedEnable);
      },
    },
    {
      title: 'Enable onRegionChangeComplete event',
      value: onRegionChangeCmpEnabled,
      onValueChange: () => {
        setOnRegChangeCmpEnabled(!onRegionChangeCmpEnabled);
      },
    },
    {
      title: 'Enable onPoiClick event',
      value: onPoiClickEnabled,
      onValueChange: () => {
        setOnPoiClickEnabled(!onPoiClickEnabled);
      },
      enabled: provider === 'google',
    },
    {
      title: 'Enable onMarkerPress event',
      value: onMarkerPressEnabled,
      onValueChange: () => {
        setOnMarkerPressEnabled(!onMarkerPressEnabled);
      },
    },
    {
      title: 'Enable onMarkerDrag event',
      value: onMarkerDragEnabled,
      onValueChange: () => {
        setOnMarkerDragEnabled(!onMarkerDragEnabled);
      },
    },
    {
      title: 'Enable onMarkerDragStarted event',
      value: onMarkerDragStartedEnabled,
      onValueChange: () => {
        setOnMarkerDragStartedEnabled(!onMarkerDragStartedEnabled);
      },
    },
    {
      title: 'Enable onMarkerDragComplete event',
      value: onMarkerDragCompleteEnabled,
      onValueChange: () => {
        setOnMarkerDragCompleteEnabled(!onMarkerDragCompleteEnabled);
      },
    },
    {
      title: 'Enable onClusterPressEnabled event',
      value: onClusterPressEnabled,
      onValueChange: () => {
        setOnClusterPressEnabled(!onClusterPressEnabled);
      },
    },
    {
      title: 'Enable onLocationChange event',
      value: onLocationChangeEnabled,
      onValueChange: () => {
        setOnLocationChangeEnabled(!onLocationChangeEnabled);
      },
    },
    {
      title: 'Enable onLocationButtonPress event',
      value: onLocationButtonPressEnabled,
      onValueChange: () => {
        setOnLocationButtonPressEnabled(!onLocationButtonPressEnabled);
      },
    },
    {
      title: 'Enable onLocationDotPress event.',
      value: onLocationDotPressEnabled,
      onValueChange: () => {
        setOnLocationDotPressEnabled(!onLocationDotPressEnabled);
      },
      enabled: provider !== 'google' || Platform.OS === 'android',
    },
  ];
  return (
    <View style={styles.container}>
      <Maps.ExpoMap
        style={{ flex: 1, width: '100%' }}
        provider={provider}
        onMapPress={(event) => {
          onMapPressEnabled &&
            setSnackbarText('Map clicked at:' + JSON.stringify(event.nativeEvent));
        }}
        onDoublePress={(event) => {
          onDoublePressEnabled &&
            setSnackbarText('Double press at:' + JSON.stringify(event.nativeEvent));
        }}
        onLongPress={(event) => {
          onLongPressEnabled &&
            setSnackbarText('Long press at:' + JSON.stringify(event.nativeEvent));
        }}
        onMapLoaded={() => {
          onMapLoadedEnabled && setSnackbarText('Map has loaded!');
        }}
        onRegionChange={(event) => {
          onRegionChangeEnabled &&
            setSnackbarText('Camera moved to:' + JSON.stringify(event.nativeEvent));
        }}
        onRegionChangeStarted={(event) => {
          onRegionChangeStartedEnable &&
            setSnackbarText('Camera started moving from:' + JSON.stringify(event.nativeEvent));
        }}
        onRegionChangeComplete={(event) => {
          onRegionChangeCmpEnabled &&
            setSnackbarText('Camera finished moving to:' + JSON.stringify(event.nativeEvent));
        }}
        onPoiClick={(event) => {
          onPoiClickEnabled && setSnackbarText('Clicked POI:' + JSON.stringify(event.nativeEvent));
        }}
        onMarkerPress={(event) => {
          onMarkerPressEnabled &&
            setSnackbarText('Clicked marker: ' + JSON.stringify(event.nativeEvent));
        }}
        onMarkerDrag={(event) => {
          onMarkerDragEnabled &&
            setSnackbarText('Dragging marker: ' + JSON.stringify(event.nativeEvent));
        }}
        onMarkerDragStarted={(event) => {
          onMarkerDragStartedEnabled &&
            setSnackbarText('Marker drag started: ' + JSON.stringify(event.nativeEvent));
        }}
        onMarkerDragComplete={(event) => {
          onMarkerDragCompleteEnabled &&
            setSnackbarText('Marker drag complete: ' + JSON.stringify(event.nativeEvent));
        }}
        onClusterPress={(event) => {
          onClusterPressEnabled &&
            setSnackbarText('Clicked on a cluster: ' + JSON.stringify(event.nativeEvent));
        }}
        onLocationChange={(event) => {
          onLocationChangeEnabled &&
            setSnackbarText("User's location has changed!" + JSON.stringify(event.nativeEvent));
        }}
        onLocationChangeEventInterval={2500}
        onLocationChangeEventPriority={LocationChangePriority.PRIORITY_HIGH_ACCURACY}
        onLocationButtonPress={(event) => {
          onLocationButtonPressEnabled &&
            setSnackbarText(
              'Location button has been pressed!' + JSON.stringify(event.nativeEvent)
            );
        }}
        onLocationDotPress={(event) => {
          onLocationDotPressEnabled &&
            setSnackbarText('Location dot has been pressed!' + JSON.stringify(event.nativeEvent));
        }}>
        <Maps.Marker
          id="100"
          latitude={48.85}
          longitude={2.35}
          markerTitle="Paris"
          markerSnippet="Marker with an id: 100"
          color="blue"
        />
        <Maps.Marker
          id="101"
          latitude={latitude}
          longitude={longitude}
          markerTitle="Madrid"
          markerSnippet="Draggable marker with an id: 101"
          draggable
          color="green"
        />
        <Maps.Cluster
          id="10"
          name="sample_cluster_group"
          minimumClusterSize={2}
          color="purple"
          opacity={0.5}
          markerTitle="Cluster"
          markerSnippet="Cluster with an id: 10">
          <Maps.Marker
            id="1"
            color="blue"
            draggable
            latitude={50}
            longitude={10}
            markerTitle="Marker"
            markerSnippet="Marker with an id: 1"
          />
          <Maps.Marker id="123" latitude={51} longitude={10} />
          <Maps.Marker id="1234" latitude={52} longitude={10.15} />
          <Maps.Marker id="12345" latitude={52} longitude={9.85} />
        </Maps.Cluster>
      </Maps.ExpoMap>
      <Snackbar
        visible={snackbarText !== undefined}
        onDismiss={() => setSnackbarText(undefined)}
        style={{ backgroundColor: 'white' }}
        wrapperStyle={styles.snackbar}
        duration={2000}>
        <Text style={{ color: 'black' }}>{snackbarText}</Text>
      </Snackbar>
      <View style={{ maxHeight: 200 }}>
        <FlatList
          contentContainerStyle={styles.eventsList}
          data={callbacksData}
          renderItem={({ item }) => <SwitchContainer {...item} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  snackbar: {
    top: 0,
  },
  eventsList: {
    padding: 20,
  },
});
