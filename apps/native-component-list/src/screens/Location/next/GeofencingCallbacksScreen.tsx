import { Geofencing, GeofencingRegion } from 'expo-location/next';
import { AppleMaps, Coordinates } from 'expo-maps';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import Button from '../../../components/Button';

export default function GeofencingCallbacksScreen() {
  const mapViewRef = React.useRef<AppleMaps.MapView>(null);
  const [geofencingRegions, setGeofencingRegions] = React.useState<GeofencingRegion[]>([]);

  useEffect(() => {
    return () => {
      // Clean up all geofencing callbacks on unmount
      geofencingRegions.forEach((region) => Geofencing.removeCallbackAsync(region.id));
    };
  }, []);

  const onMapPress = async ({ coordinates }: { coordinates: Coordinates }) => {
    const newRegion = {
      id: `${coordinates.latitude},${coordinates.longitude}`,
      coordinates: {
        latitude: coordinates.latitude!,
        longitude: coordinates.longitude!,
      },
      radius: 75,
    };

    const id = await Geofencing.addCallbackAsync(newRegion, (event) => {
      console.log('Geofencing event:', event);
      // console.log(`You're ${event.state} a region ${event.region.id}`);
    });
    console.log(`Added geofencing callback with id: ${id}`);
    const updatedRegions = [...geofencingRegions, newRegion];
    setGeofencingRegions(updatedRegions);
  };

  return (
    <View style={styles.screen}>
      <AppleMaps.View
        ref={mapViewRef}
        style={{ flex: 1 }}
        onMapClick={onMapPress}
        circles={geofencingRegions.map((region) => ({
          center: region.coordinates,
          radius: region.radius,
        }))}
      />
      <View style={styles.buttons}>
        <Button
          buttonStyle={styles.button}
          title="Clear all regions"
          disabled={geofencingRegions.length === 0}
          onPress={() =>
            setGeofencingRegions((prev) => {
              prev.forEach(async (region) =>
                console.log(await Geofencing.removeCallbackAsync(region.id))
              );
              return [];
            })
          }
        />
        <Button
          buttonStyle={styles.button}
          title="Center camera"
          onPress={() => mapViewRef.current?.setCameraPosition()}
        />
      </View>
    </View>
  );
}

GeofencingCallbacksScreen.navigationOptions = {
  title: 'Geofencing Map',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapView: {
    flex: 1,
  },
  buttons: {
    alignItems: 'flex-end',
    padding: 10,
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
  },
  button: {
    padding: 10,
    marginVertical: 5,
  },
});
