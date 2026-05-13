import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { AppleMaps, Coordinates } from 'expo-maps';
import { AppleMapsCircle } from 'expo-maps/build/apple/AppleMaps.types';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import React, { useEffect, useMemo, useState } from 'react';
import { NativeSyntheticEvent, Platform, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';

const GEOFENCING_TASK = 'geofencing';

type GeofencingRegion = {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
};

export type MapEvent<T = object> = NativeSyntheticEvent<
  T & {
    coordinate: {
      latitude: number;
      longitude: number;
    };
    position: {
      x: number;
      y: number;
    };
  }
>;

type State = {
  isGeofencing: boolean;
  geofencingRegions: GeofencingRegion[];
  coordinates: Coordinates;
};

const initialState: State = {
  isGeofencing: false,
  geofencingRegions: [],
  coordinates: {
    // Apple Park in Cupertino
    longitude: -122.031,
    latitude: 37.332,
  },
};

function GeofencingAppleScreen() {
  const [coordinates, setCoordinates] = useState<Coordinates>(initialState.coordinates);
  const [isGeofencing, setIsGeofencing] = useState<boolean>(false);
  const [geofencingRegions, setGeofencingRegions] = useState<GeofencingRegion[]>([]);

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();

      const [{ coords }, isGeofencing, geofencingRegions] = await Promise.all([
        Location.getCurrentPositionAsync(),
        Location.hasStartedGeofencingAsync(GEOFENCING_TASK),
        getSavedRegions(),
      ]);

      setCoordinates(coords);
      setIsGeofencing(isGeofencing);
      setGeofencingRegions(geofencingRegions);
    })();
  }, []);

  async function toggleGeofencing() {
    if (isGeofencing) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      setIsGeofencing(false);
      setGeofencingRegions([]);
    } else {
      await Location.startGeofencingAsync(GEOFENCING_TASK, geofencingRegions);
    }
  }

  async function centerMap() {
    const { coords } = await Location.getCurrentPositionAsync();
    setCoordinates(coords);
  }

  async function onMapClick({ coordinates }: { coordinates: Coordinates }) {
    if (!coordinates.latitude || !coordinates.longitude) {
      return;
    }
    const newGeofencingRegions = [
      ...geofencingRegions,
      {
        identifier: `${coordinates.latitude},${coordinates.longitude}`,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius: 500,
      },
    ];
    if (isGeofencing) {
      // update existing geofencing task
      await Location.startGeofencingAsync(GEOFENCING_TASK, newGeofencingRegions);
    }
    setGeofencingRegions(newGeofencingRegions);
  }

  const circles: AppleMapsCircle[] = useMemo(() => {
    return geofencingRegions.map((region) => {
      return {
        center: {
          longitude: region.longitude,
          latitude: region.latitude,
        },
        radius: region.radius,
        lineWidth: 4,
        lineColor: 'rgba(78,155,222,0.8)',
        color: 'rgba(78,155,222,0.2)',
      };
    });
  }, [geofencingRegions]);

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
        style={styles.mapView}
        cameraPosition={{ coordinates, zoom: 12 }}
        circles={circles}
        onMapClick={onMapClick}
        properties={{
          isMyLocationEnabled: true,
        }}
      />
      <View style={styles.buttons}>
        <View style={styles.leftButtons}>
          <Button
            disabled={!isGeofencing && geofencingRegions.length === 0}
            buttonStyle={styles.button}
            title={isGeofencing ? 'Stop geofencing' : 'Start geofencing'}
            onPress={toggleGeofencing}
          />
        </View>
        <Button buttonStyle={styles.button} title="Center" onPress={centerMap} />
      </View>
    </View>
  );
}

function GeofencingAndroidScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.notSupportedText}>
        This example is currently not supported on Android 🤖{'\n'}
        If you are reading this, you were chosen to make it 🤓
      </Text>
    </View>
  );
}

export default function GeofencingScreen() {
  if (Platform.OS === 'ios' || Platform.OS === 'macos') {
    return <GeofencingAppleScreen />;
  }
  return <GeofencingAndroidScreen />;
}

GeofencingScreen.navigationOptions = {
  title: 'Geofencing Map',
};

async function getSavedRegions(): Promise<GeofencingRegion[]> {
  const tasks = await TaskManager.getRegisteredTasksAsync();
  const task = tasks.find(({ taskName }) => taskName === GEOFENCING_TASK);
  return task ? task.options.regions : [];
}

TaskManager.defineTask(GEOFENCING_TASK, async ({ data: { region } }: { data: any }) => {
  const stateString = Location.GeofencingRegionState[region.state].toLowerCase();

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
    justifyContent: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 10,
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
  },
  leftButtons: {
    alignItems: 'flex-start',
  },
  button: {
    padding: 10,
    marginVertical: 5,
  },
  notSupportedText: {
    margin: 30,
    fontSize: 24,
    textAlign: 'center',
  },
});
