import { MaterialIcons } from '@expo/vector-icons';
// import { useFocusEffect } from '@react-navigation/native';
import { Notifications } from 'expo';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import * as TaskManager from 'expo-task-manager';
import * as React from 'react';
import { NativeSyntheticEvent, Platform, StyleSheet, Text, View, Linking } from 'react-native';
import MapView, { Circle } from 'react-native-maps';

import Button from '../components/PrimaryButton';

const GEOFENCING_TASK = 'geofencing';
const REGION_RADIUSES = [30, 50, 75, 100, 150, 200];

interface GeofencingRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface MapEvent<T = object>
  extends NativeSyntheticEvent<
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
  > {}

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
  newRegionRadius: number;
};

const initialState: State = {
  isGeofencing: false,
  geofencingRegions: [],
  initialRegion: null,
  newRegionRadius: REGION_RADIUSES[1],
};

function reducer(
  state: State,
  action:
    | { type: 'toggle' }
    | { type: 'clearRegions' }
    | { type: 'shiftRegionRadius' }
    | ({ type: 'update' } & State)
    | ({ type: 'updateRegions' } & Pick<State, 'geofencingRegions'>)
): State {
  switch (action.type) {
    case 'update':
      return {
        newRegionRadius: action.newRegionRadius,
        isGeofencing: action.isGeofencing,
        geofencingRegions: action.geofencingRegions,
        initialRegion: action.initialRegion,
      };
    case 'updateRegions':
      return {
        ...state,
        geofencingRegions: action.geofencingRegions,
      };
    case 'shiftRegionRadius': {
      const index = REGION_RADIUSES.indexOf(state.newRegionRadius) + 1;
      const radius = index < REGION_RADIUSES.length ? REGION_RADIUSES[index] : REGION_RADIUSES[0];

      return {
        ...state,
        newRegionRadius: radius,
      };
    }
    case 'clearRegions':
      return { ...state, geofencingRegions: [] };
    case 'toggle':
      return { ...state, isGeofencing: !state.isGeofencing };
  }
}

export default function GeofencingScreen(props) {
  const [permission] = Permissions.usePermissions(Permissions.LOCATION, { ask: true });

  if (!permission?.granted) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>
          Location permissions are required in order to use this feature. You can manually enable
          them at any time in the "Location Services" section of the Settings app.
        </Text>
        <Button
          style={styles.button}
          onPress={() => {
            Linking.openSettings();
          }}>
          Open Settings
        </Button>
      </View>
    );
  }

  return <GeofencingView {...props} />;
}

GeofencingScreen.navigationOptions = {
  title: 'Geofencing',
};

function GeofencingView() {
  const mapViewRef = React.useRef<MapView>(null);
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const onFocus = React.useCallback(() => {
    let isActive = true;

    (async () => {
      await Location.requestPermissionsAsync();

      const { coords } = await Location.getCurrentPositionAsync();
      const isGeofencing = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);
      const geofencingRegions = await getSavedRegions();

      if (isActive) {
        dispatch({
          type: 'update',
          isGeofencing,
          geofencingRegions,
          newRegionRadius: state.newRegionRadius,
          initialRegion: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.004,
            longitudeDelta: 0.002,
          },
        });
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(onFocus, []);
  // useFocusEffect(onFocus);

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
      radius: state.newRegionRadius,
    });
    dispatch({ type: 'updateRegions', geofencingRegions: next });

    if (await Location.hasStartedGeofencingAsync(GEOFENCING_TASK)) {
      // update existing geofencing task
      await Location.startGeofencingAsync(GEOFENCING_TASK, next);
    }
  };

  const renderRegions = React.useCallback(() => {
    return state.geofencingRegions.map((region, i) => {
      return (
        <Circle
          key={region.identifier}
          center={region}
          radius={region.radius}
          strokeColor="rgba(78,155,222,0.8)"
          fillColor="rgba(78,155,222,0.2)"
        />
      );
    });
  }, [state.geofencingRegions.map(({ identifier }) => identifier).join('__')]);

  if (!state.initialRegion) {
    return null;
  }

  const shiftRegionRadius = () => {
    dispatch({ type: 'shiftRegionRadius' });
  };

  const canToggle = state.isGeofencing || state.geofencingRegions.length > 0;

  const getGeofencingButtonContent = () => {
    if (canToggle) {
      return state.isGeofencing ? 'Stop geofencing' : 'Start geofencing';
    }
    return 'Select at least one region on the map';
  };

  return (
    <View style={styles.screen}>
      <View style={styles.heading}>
        <BlurView tint="light" intensity={70} style={styles.blurView}>
          <Text style={styles.headingText}>
            {state.isGeofencing
              ? 'You will be receiving notifications when the device enters or exits from selected regions.'
              : // tslint:disable-next-line: max-line-length
                'Click `Start geofencing` to start getting geofencing notifications. Tap on the map to select geofencing regions.'}
          </Text>
        </BlurView>

        <View style={styles.buttons} pointerEvents="box-none">
          <View style={styles.topButtons}>
            <View style={styles.buttonsColumn}>
              <Button style={styles.button} onPress={shiftRegionRadius}>
                {`Radius: ${state.newRegionRadius}m`}
              </Button>
            </View>
            <View style={styles.buttonsColumn}>
              <Button style={styles.button} onPress={centerMap}>
                <MaterialIcons name="my-location" size={20} color="white" />
              </Button>
            </View>
          </View>
        </View>
      </View>

      <MapView
        ref={mapViewRef}
        style={styles.mapView}
        initialRegion={state.initialRegion}
        onPress={onMapPress}
        showsUserLocation>
        {renderRegions()}
      </MapView>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View style={styles.bottomButtons}>
          <Button
            disabled={!canToggle}
            style={[styles.button, canToggle ? null : styles.disabledButton]}
            onPress={toggleGeofencing}>
            {getGeofencingButtonContent()}
          </Button>
        </View>
      </View>
    </View>
  );
}

async function getSavedRegions(): Promise<GeofencingRegion[]> {
  const tasks = await TaskManager.getRegisteredTasksAsync();
  const task = tasks.find(({ taskName }) => taskName === GEOFENCING_TASK);
  return task ? task.options.regions : [];
}

if (Platform.OS !== 'android') {
  TaskManager.defineTask(GEOFENCING_TASK, async ({ data: { region } }: { data: any }) => {
    const stateString = Location.GeofencingRegionState[region.state].toLowerCase();
    const body = `You're ${stateString} a region with latitude: ${region.latitude}, longitude: ${region.longitude} and radius: ${region.radius}m`;

    await Notifications.presentLocalNotificationAsync({
      title: 'Expo Geofencing',
      body,
      data: {
        ...region,
        notificationBody: body,
        notificationType: GEOFENCING_TASK,
      },
    });
  });
}

Notifications.addListener(({ data, remote }) => {
  if (!remote && data.notificationType === GEOFENCING_TASK) {
    alert(data.notificationBody);
  }
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapView: {
    flex: 1,
  },
  buttons: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomButtons: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  buttonsColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  button: {
    paddingVertical: 5,
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  disabledButton: {
    backgroundColor: 'gray',
    opacity: 0.8,
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.7)',
    margin: 20,
  },
  heading: {
    padding: 8,
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 2,
  },
  blurView: {
    flex: 1,
    padding: 5,
    borderRadius: 4,
  },
  headingText: {
    textAlign: 'center',
  },
});
