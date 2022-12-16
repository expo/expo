import FontAwesome from '@expo/vector-icons/build/FontAwesome';
import MaterialIcons from '@expo/vector-icons/build/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { EventEmitter, EventSubscription } from 'fbemitter';
import * as React from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';

import Button from '../../components/Button';
import Colors from '../../constants/Colors';
import usePermissions from '../../utilities/usePermissions';

const STORAGE_KEY = 'expo-home-locations';
const LOCATION_UPDATES_TASK = 'location-updates';

const locationEventsEmitter = new EventEmitter();

const locationAccuracyStates: { [key in Location.Accuracy]: Location.Accuracy } = {
  [Location.Accuracy.Lowest]: Location.Accuracy.Low,
  [Location.Accuracy.Low]: Location.Accuracy.Balanced,
  [Location.Accuracy.Balanced]: Location.Accuracy.High,
  [Location.Accuracy.High]: Location.Accuracy.Highest,
  [Location.Accuracy.Highest]: Location.Accuracy.BestForNavigation,
  [Location.Accuracy.BestForNavigation]: Location.Accuracy.Lowest,
};

const locationActivityTypes: {
  [key in Location.ActivityType]: Location.ActivityType | undefined;
} = {
  [Location.ActivityType.Other]: Location.ActivityType.AutomotiveNavigation,
  [Location.ActivityType.AutomotiveNavigation]: Location.ActivityType.Fitness,
  [Location.ActivityType.Fitness]: Location.ActivityType.OtherNavigation,
  [Location.ActivityType.OtherNavigation]: Location.ActivityType.Airborne,
  [Location.ActivityType.Airborne]: undefined,
};

interface Props {
  navigation: StackNavigationProp<any>;
}

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type State = Pick<Location.LocationTaskOptions, 'showsBackgroundLocationIndicator'> & {
  activityType: Location.ActivityType | null;
  accuracy: Location.Accuracy;
  isTracking: boolean;
  savedLocations: any[];
  initialRegion: Region | null;
};

const initialState: State = {
  isTracking: false,
  savedLocations: [],
  activityType: null,
  accuracy: Location.Accuracy.High,
  initialRegion: null,
  showsBackgroundLocationIndicator: false,
};

function reducer(state: State, action: Partial<State>): State {
  return {
    ...state,
    ...action,
  };
}

export default function BackgroundLocationMapScreen(props: Props) {
  const [permission] = usePermissions(Location.requestForegroundPermissionsAsync);

  React.useEffect(() => {
    (async () => {
      if (!(await Location.isBackgroundLocationAvailableAsync())) {
        alert('Background location is not available in this application.');
        props.navigation.goBack();
      }
    })();
  }, [props.navigation]);

  if (!permission) {
    return (
      <Text style={styles.errorText}>
        Location permissions are required in order to use this feature. You can manually enable them
        at any time in the "Location Services" section of the Settings app.
      </Text>
    );
  }

  return <BackgroundLocationMapView />;
}

function BackgroundLocationMapView() {
  const mapViewRef = React.useRef<MapView>(null);
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const onFocus = React.useCallback(() => {
    let subscription: EventSubscription | null = null;
    let isMounted = true;
    (async () => {
      if ((await Location.getBackgroundPermissionsAsync()).status !== 'granted') {
        console.log(
          'Missing background location permissions. Make sure it is granted in the OS Settings.'
        );
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync();
      const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_UPDATES_TASK);
      const task = (await TaskManager.getRegisteredTasksAsync()).find(
        ({ taskName }) => taskName === LOCATION_UPDATES_TASK
      );
      const savedLocations = await getSavedLocations();

      subscription = locationEventsEmitter.addListener('update', (savedLocations: any) => {
        if (isMounted) dispatch({ savedLocations });
      });

      if (!isTracking) {
        alert('Click `Start tracking` to start getting location updates.');
      }

      if (!isMounted) return;

      dispatch({
        isTracking,
        accuracy: task?.options.accuracy ?? state.accuracy,
        showsBackgroundLocationIndicator: task?.options.showsBackgroundLocationIndicator,
        activityType: task?.options.activityType ?? null,
        savedLocations,
        initialRegion: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.002,
        },
      });
    })();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [state.accuracy, state.isTracking]);

  useFocusEffect(onFocus);

  const startLocationUpdates = React.useCallback(
    async (acc = state.accuracy) => {
      if ((await Location.getBackgroundPermissionsAsync()).status !== 'granted') {
        console.log(
          'Missing background location permissions. Make sure it is granted in the OS Settings.'
        );
        return;
      }
      await Location.startLocationUpdatesAsync(LOCATION_UPDATES_TASK, {
        accuracy: acc,
        activityType: state.activityType ?? undefined,
        pausesUpdatesAutomatically: state.activityType != null,
        showsBackgroundLocationIndicator: state.showsBackgroundLocationIndicator,
        deferredUpdatesInterval: 60 * 1000, // 1 minute
        deferredUpdatesDistance: 100, // 100 meters
        foregroundService: {
          notificationTitle: 'expo-location-demo',
          notificationBody: 'Background location is running...',
          notificationColor: Colors.tintColor,
        },
      });

      if (!state.isTracking) {
        alert(
          // tslint:disable-next-line max-line-length
          'Now you can send app to the background, go somewhere and come back here! You can even terminate the app and it will be woken up when the new significant location change comes out.'
        );
      }
      dispatch({
        isTracking: true,
      });
    },
    [state.isTracking, state.accuracy, state.activityType, state.showsBackgroundLocationIndicator]
  );

  const stopLocationUpdates = React.useCallback(async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    dispatch({
      isTracking: false,
    });
  }, []);

  const clearLocations = React.useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    dispatch({
      savedLocations: [],
    });
  }, []);

  const toggleTracking = React.useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);

    if (state.isTracking) {
      await stopLocationUpdates();
    } else {
      await startLocationUpdates();
    }
    dispatch({
      savedLocations: [],
    });
  }, [state.isTracking, startLocationUpdates, stopLocationUpdates]);

  const onAccuracyChange = React.useCallback(() => {
    const currentAccuracy = locationAccuracyStates[state.accuracy];

    dispatch({
      accuracy: currentAccuracy,
    });

    if (state.isTracking) {
      // Restart background task with the new accuracy.
      startLocationUpdates(currentAccuracy);
    }
  }, [state.accuracy, state.isTracking, startLocationUpdates]);

  const toggleLocationIndicator = React.useCallback(() => {
    dispatch({
      showsBackgroundLocationIndicator: !state.showsBackgroundLocationIndicator,
    });
    if (state.isTracking) {
      startLocationUpdates();
    }
  }, [state.showsBackgroundLocationIndicator, state.isTracking, startLocationUpdates]);

  const toggleActivityType = React.useCallback(() => {
    let nextActivityType: Location.ActivityType | null;
    if (state.activityType) {
      nextActivityType = locationActivityTypes[state.activityType] ?? null;
    } else {
      nextActivityType = Location.ActivityType.Other;
    }
    dispatch({
      activityType: nextActivityType,
    });

    if (state.isTracking) {
      // Restart background task with the new activity type
      startLocationUpdates();
    }
  }, [state.activityType, state.isTracking, startLocationUpdates]);

  const onCenterMap = React.useCallback(async () => {
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

  const renderPolyline = React.useCallback(() => {
    if (state.savedLocations.length === 0) {
      return null;
    }
    return (
      // @ts-ignore
      <MapView.Polyline
        coordinates={state.savedLocations}
        strokeWidth={3}
        strokeColor={Colors.tintColor}
      />
    );
  }, [state.savedLocations]);

  return (
    <View style={styles.screen}>
      <PermissionsModal />
      <MapView
        ref={mapViewRef}
        style={styles.mapView}
        initialRegion={state.initialRegion ?? undefined}
        showsUserLocation>
        {renderPolyline()}
      </MapView>
      <View style={styles.buttons} pointerEvents="box-none">
        <View style={styles.topButtons}>
          <View style={styles.buttonsColumn}>
            {Platform.OS === 'android' ? null : (
              <Button style={styles.button} onPress={toggleLocationIndicator}>
                <View style={styles.buttonContentWrapper}>
                  <Text style={styles.text}>
                    {state.showsBackgroundLocationIndicator ? 'Hide' : 'Show'}
                  </Text>
                  <Text style={styles.text}> background </Text>
                  <FontAwesome name="location-arrow" size={20} color="white" />
                  <Text style={styles.text}> indicator</Text>
                </View>
              </Button>
            )}
            {Platform.OS === 'android' ? null : (
              <Button
                style={styles.button}
                onPress={toggleActivityType}
                title={
                  state.activityType
                    ? `Activity type: ${Location.ActivityType[state.activityType]}`
                    : 'No activity type'
                }
              />
            )}
            <Button
              title={`Accuracy: ${Location.Accuracy[state.accuracy]}`}
              style={styles.button}
              onPress={onAccuracyChange}
            />
          </View>
          <View style={styles.buttonsColumn}>
            <Button style={styles.button} onPress={onCenterMap}>
              <MaterialIcons name="my-location" size={20} color="white" />
            </Button>
          </View>
        </View>

        <View style={styles.bottomButtons}>
          <Button title="Clear locations" style={styles.button} onPress={clearLocations} />
          <Button
            title={state.isTracking ? 'Stop tracking' : 'Start tracking'}
            style={styles.button}
            onPress={toggleTracking}
          />
        </View>
      </View>
    </View>
  );
}

const PermissionsModal = () => {
  const [showPermissionsModal, setShowPermissionsModal] = React.useState(true);
  const [permission] = usePermissions(Location.getBackgroundPermissionsAsync);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={!permission && showPermissionsModal}
      onRequestClose={() => {
        setShowPermissionsModal(!showPermissionsModal);
      }}>
      <View style={{ flex: 1, justifyContent: 'space-around', alignItems: 'center' }}>
        <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.modalHeader}>Background location access</Text>

          <Text style={styles.modalText}>
            This app collects location data to enable updating the MapView in the background even
            when the app is closed or not in use. Otherwise, your location on the map will only be
            updated while the app is foregrounded.
          </Text>
          <Text style={styles.modalText}>
            This data is not used for anything other than updating the position on the map, and this
            data is never shared with anyone.
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Button
            title="Request background location permission"
            style={styles.button}
            onPress={async () => {
              // Need both background and foreground permissions
              await Location.requestForegroundPermissionsAsync();
              await Location.requestBackgroundPermissionsAsync();
              setShowPermissionsModal(!showPermissionsModal);
            }}
          />
          <Button
            title="Continue without background location permission"
            style={styles.button}
            onPress={() => setShowPermissionsModal(!showPermissionsModal)}
          />
        </View>
      </View>
    </Modal>
  );
};

BackgroundLocationMapScreen.navigationOptions = {
  title: 'Background location',
};

async function getSavedLocations() {
  try {
    const item = await AsyncStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

TaskManager.defineTask(LOCATION_UPDATES_TASK, async ({ data: { locations } }: any) => {
  if (locations && locations.length > 0) {
    const savedLocations = await getSavedLocations();
    const newLocations = locations.map(({ coords }: any) => ({
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));

    // tslint:disable-next-line no-console
    console.log(`Received new locations at ${new Date()}:`, locations);

    savedLocations.push(...newLocations);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedLocations));

    locationEventsEmitter.emit('update', savedLocations);
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
    padding: 10,
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  buttonContentWrapper: {
    flexDirection: 'row',
  },
  text: {
    color: 'white',
    fontWeight: '700',
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.7)',
    margin: 20,
  },
  modalHeader: { padding: 12, fontSize: 20, fontWeight: '800' },
  modalText: { padding: 8, fontWeight: '600' },
});
