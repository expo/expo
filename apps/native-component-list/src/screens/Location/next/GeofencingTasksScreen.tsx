import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Geofencing, GeofencingRegion, Location } from 'expo-location/next';
import { AppleMaps, Coordinates } from 'expo-maps';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../../components/Button';

const GEOFENCING_TASK = 'geofencing';

export default function GeofencingScreen() {
  const mapViewRef = React.useRef<AppleMaps.MapView>(null);
  const [isGeofencing, setIsGeofencing] = React.useState(false);
  const [geofencingRegions, setGeofencingRegions] = React.useState<GeofencingRegion[]>([]);

  const onFocus = React.useCallback(() => {
    let isActive = true;

    (async () => {
      await Location.requestForegroundPermissionsAsync();

      const isGeofencingActive = await Geofencing.hasTaskStartedAsync(GEOFENCING_TASK);
      const savedRegions = await getSavedRegions();

      if (isActive) {
        setIsGeofencing(isGeofencingActive);
        setGeofencingRegions(savedRegions || []);
      }
    })();
    return () => (isActive = false);
  }, []);

  useFocusEffect(onFocus);

  const onMapPress = async ({ coordinates }: { coordinates: Coordinates }) => {
    const newRegion = {
      id: `${coordinates.latitude},${coordinates.longitude}`,
      coordinates: {
        latitude: coordinates.latitude!,
        longitude: coordinates.longitude!,
      },
      radius: 50,
    };

    const updatedRegions = [...geofencingRegions, newRegion];
    setGeofencingRegions(updatedRegions);

    if (await Geofencing.hasTaskStartedAsync(GEOFENCING_TASK)) {
      // update existing geofencing task
      await Geofencing.startTaskAsync(GEOFENCING_TASK, updatedRegions);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.heading}>
        <BlurView tint="light" intensity={70} style={styles.blurView}>
          <Text style={styles.headingText}>
            {isGeofencing
              ? 'You will be receiving notifications when the device enters or exits from selected regions.'
              : 'Click `Start geofencing` to start getting geofencing notifications. Tap on the map to select geofencing regions.'}
          </Text>
        </BlurView>
      </View>

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
          disabled={!isGeofencing && geofencingRegions.length === 0}
          buttonStyle={styles.button}
          title={isGeofencing ? 'Stop geofencing' : 'Start geofencing'}
          onPress={async () => {
            if (isGeofencing) await Geofencing.stopTaskAsync(GEOFENCING_TASK);
            else await Geofencing.startTaskAsync(GEOFENCING_TASK, geofencingRegions);
            setIsGeofencing((prev) => !prev);
          }}
        />
        <Button
          buttonStyle={styles.button}
          title="Clear regions"
          disabled={geofencingRegions.length === 0 || isGeofencing}
          onPress={() => setGeofencingRegions([])}
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

GeofencingScreen.navigationOptions = {
  title: 'Geofencing Map',
};

async function getSavedRegions(): Promise<any[]> {
  // async function getSavedRegions(): Promise<Location.LocationRegion[]> {
  const tasks = await TaskManager.getRegisteredTasksAsync();
  const task = tasks.find(({ taskName }) => taskName === GEOFENCING_TASK);
  console.log('getSavedRegions', task);
  return task ? task.options.regions : [];
}

TaskManager.defineTask(GEOFENCING_TASK, async ({ data: { region } }: { data: any }) => {
  // const stateString = Location.GeofencingRegionState[region.state].toLowerCase();
  const stateString = region.state;

  console.log(`${stateString} region ${region.identifier}`);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Expo Geofencing',
      body: `You're ${stateString} a region ${region.identifier}`,
      data: region,
    },
    trigger: null,
  });
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  heading: {
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 2,
  },
  blurView: {
    flex: 1,
    padding: 5,
  },
  headingText: {
    textAlign: 'center',
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
