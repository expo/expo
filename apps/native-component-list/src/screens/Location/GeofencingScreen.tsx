import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { NativeSyntheticEvent, StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';

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

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type State = {
  isGeofencing: boolean;
  geofencingRegions: GeofencingRegion[];
  initialRegion: Region | null;
};

const initialState: State = { isGeofencing: false, geofencingRegions: [], initialRegion: null };

function reducer(
  state: State,
  action:
    | { type: 'toggle' }
    | { type: 'clearRegions' }
    | ({ type: 'update' } & State)
    | ({ type: 'updateRegions' } & Pick<State, 'geofencingRegions'>)
): State {
  switch (action.type) {
    case 'update':
      return {
        isGeofencing: action.isGeofencing,
        geofencingRegions: action.geofencingRegions,
        initialRegion: action.initialRegion,
      };
    case 'updateRegions':
      return {
        ...state,
        geofencingRegions: action.geofencingRegions,
      };
    case 'clearRegions':
      return { ...state, geofencingRegions: [] };
    case 'toggle':
      return { ...state, isGeofencing: !state.isGeofencing };
  }
}

export default function GeofencingScreen() {
  const mapViewRef = React.useRef<MapView>(null);
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const onFocus = React.useCallback(() => {
    let isActive = true;

    (async () => {
      await Location.requestForegroundPermissionsAsync();

      const { coords } = await Location.getCurrentPositionAsync();
      const isGeofencing = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);
      const geofencingRegions = await getSavedRegions();

      if (isActive) {
        dispatch({
          type: 'update',
          isGeofencing,
          geofencingRegions,
          initialRegion: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.004,
            longitudeDelta: 0.002,
          },
        });
      }
    })();
    return () => (isActive = false);
  }, []);

  useFocusEffect(onFocus);

  const toggleGeofencing = React.useCallback(async () => {
    if (state.isGeofencing) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      dispatch({ type: 'clearRegions' });
    } else {
      await Location.startGeofencingAsync(GEOFENCING_TASK, state.geofencingRegions);
    }
    dispatch({ type: 'toggle' });
  }, [state.isGeofencing, state.geofencingRegions]);

  const centerMap = React.useCallback(async () => {
    const { coords } = await Location.getCurrentPositionAsync();
    const mapView = mapViewRef.current;

    if (mapView) {
      mapView.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.002,
      });
    }
  }, []);

  const onMapPress = async ({ nativeEvent: { coordinate } }: MapEvent) => {
    const next = [...state.geofencingRegions];
    next.push({
      identifier: `${coordinate.latitude},${coordinate.longitude}`,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      radius: 50,
    });
    dispatch({ type: 'updateRegions', geofencingRegions: next });

    if (await Location.hasStartedGeofencingAsync(GEOFENCING_TASK)) {
      // update existing geofencing task
      await Location.startGeofencingAsync(GEOFENCING_TASK, next);
    }
  };

  const renderRegions = React.useCallback(() => {
    return state.geofencingRegions.map((region) => {
      return (
        // @ts-ignore
        <MapView.Circle
          key={region.identifier}
          center={region}
          radius={region.radius}
          strokeColor="rgba(78,155,222,0.8)"
          fillColor="rgba(78,155,222,0.2)"
        />
      );
    });
  }, [state.geofencingRegions]);

  if (!state.initialRegion) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.heading}>
        <BlurView tint="light" intensity={70} style={styles.blurView}>
          <Text style={styles.headingText}>
            {state.isGeofencing
              ? 'You will be receiving notifications when the device enters or exits from selected regions.'
              : 'Click `Start geofencing` to start getting geofencing notifications. Tap on the map to select geofencing regions.'}
          </Text>
        </BlurView>
      </View>

      <MapView
        ref={mapViewRef}
        style={styles.mapView}
        initialRegion={state.initialRegion}
        onPress={onMapPress}
        showsUserLocation>
        {renderRegions()}
      </MapView>
      <View style={styles.buttons}>
        <View style={styles.leftButtons}>
          <Button
            disabled={!state.isGeofencing && state.geofencingRegions.length === 0}
            buttonStyle={styles.button}
            title={state.isGeofencing ? 'Stop geofencing' : 'Start geofencing'}
            onPress={toggleGeofencing}
          />
        </View>
        <Button buttonStyle={styles.button} title="Center" onPress={centerMap} />
      </View>
    </View>
  );
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
});
