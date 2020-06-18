import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import * as TaskManager from 'expo-task-manager';
import { EventEmitter, EventSubscription } from 'fbemitter';
import * as React from 'react';
import { AppState, AsyncStorage, Platform, StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';

import Button from '../../components/Button';
import Colors from '../../constants/Colors';

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

export default function BackgroundLocationMapScreen(props: Props) {
  const mapViewRef = React.useRef<MapView>(null);
  const [isTracking, setIsTracking] = React.useState<boolean>(false);
  const [savedLocations, setSavedLocations] = React.useState([]);
  const [activityType, setActivityType] = React.useState<Location.ActivityType | undefined>();
  const [error, setError] = React.useState<string | null>(null);
  const [accuracy, setAccuracy] = React.useState<Location.Accuracy>(Location.Accuracy.High);
  const [initialRegion, setInitialRegion] = React.useState<any>();
  const [showsBackgroundLocationIndicator, setShowsBackgroundLocationIndicator] = React.useState<
    boolean
  >(false);

  const [eventSubscription, setSubscription] = React.useState<EventSubscription | null>(null);

  const didFocus = async () => {
    if (!(await Location.isBackgroundLocationAvailableAsync())) {
      alert('Background location is not available in this application.');
      props.navigation.goBack();
      return;
    }

    const { status } = await Permissions.askAsync(Permissions.LOCATION);

    if (status !== 'granted') {
      AppState.addEventListener('change', handleAppStateChange);
      // tslint:disable-next-line max-line-length
      setError(
        'Location permissions are required in order to use this feature. You can manually enable them at any time in the "Location Services" section of the Settings app.'
      );
      return;
    } else {
      setError(null);
    }

    const { coords } = await Location.getCurrentPositionAsync();
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    const task = (await TaskManager.getRegisteredTasksAsync()).find(
      ({ taskName }) => taskName === LOCATION_UPDATES_TASK
    );
    const savedLocations = await getSavedLocations();
    const nextAccuracy = task?.options.accuracy ?? accuracy;

    setSubscription(
      locationEventsEmitter.addListener('update', (locations: any) => {
        setSavedLocations(locations);
      })
    );

    if (!isTracking) {
      alert('Click `Start tracking` to start getting location updates.');
    }

    setAccuracy(nextAccuracy);
    setIsTracking(isTracking);
    setShowsBackgroundLocationIndicator(task && task.options.showsBackgroundLocationIndicator);
    setActivityType(task?.options.activityType);
    setSavedLocations(savedLocations);
    setInitialRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.004,
      longitudeDelta: 0.002,
    });
  };

  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState !== 'active') {
      return;
    }

    if (initialRegion) {
      AppState.removeEventListener('change', handleAppStateChange);
      return;
    }

    didFocus();
  };

  useFocusEffect(() => {
    didFocus();
  });

  React.useEffect(() => {
    return () => {
      if (eventSubscription) {
        eventSubscription.remove();
      }
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  const startLocationUpdates = async (acc = accuracy) => {
    await Location.startLocationUpdatesAsync(LOCATION_UPDATES_TASK, {
      accuracy: acc,
      activityType,
      pausesUpdatesAutomatically: activityType != null,
      showsBackgroundLocationIndicator,
      deferredUpdatesInterval: 60 * 1000, // 1 minute
      deferredUpdatesDistance: 100, // 100 meters
      foregroundService: {
        notificationTitle: 'expo-location-demo',
        notificationBody: 'Background location is running...',
        notificationColor: Colors.tintColor,
      },
    });

    if (!isTracking) {
      alert(
        // tslint:disable-next-line max-line-length
        'Now you can send app to the background, go somewhere and come back here! You can even terminate the app and it will be woken up when the new significant location change comes out.'
      );
    }
    setIsTracking(true);
  };

  const stopLocationUpdates = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    setIsTracking(false);
  };

  const clearLocations = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setSavedLocations([]);
  };

  const toggleTracking = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);

    if (isTracking) {
      await stopLocationUpdates();
    } else {
      await startLocationUpdates();
    }
    setSavedLocations([]);
  };

  const onAccuracyChange = () => {
    const currentAccuracy = locationAccuracyStates[accuracy];

    setAccuracy(currentAccuracy);

    if (isTracking) {
      // Restart background task with the new accuracy.
      startLocationUpdates(currentAccuracy);
    }
  };

  const toggleLocationIndicator = async () => {
    setShowsBackgroundLocationIndicator(!showsBackgroundLocationIndicator);
    if (isTracking) {
      await startLocationUpdates();
    }
  };

  const toggleActivityType = () => {
    if (activityType) {
      const nextActivityType = locationActivityTypes[activityType];
      setActivityType(nextActivityType);
    } else {
      setActivityType(Location.ActivityType.Other);
    }

    if (isTracking) {
      // Restart background task with the new activity type
      startLocationUpdates();
    }
  };

  const onCenterMap = async () => {
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
  };

  const renderPolyline = () => {
    if (savedLocations.length === 0) {
      return null;
    }
    return (
      // @ts-ignore
      <MapView.Polyline
        coordinates={savedLocations}
        strokeWidth={3}
        strokeColor={Colors.tintColor}
      />
    );
  };

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!initialRegion) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapViewRef}
        style={styles.mapView}
        initialRegion={initialRegion}
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
                    {showsBackgroundLocationIndicator ? 'Hide' : 'Show'}
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
                  activityType
                    ? `Activity type: ${Location.ActivityType[activityType]}`
                    : 'No activity type'
                }
              />
            )}
            <Button
              title={`Accuracy: ${Location.Accuracy[accuracy]}`}
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
            title={isTracking ? 'Stop tracking' : 'Start tracking'}
            style={styles.button}
            onPress={toggleTracking}
          />
        </View>
      </View>
    </View>
  );
}

BackgroundLocationMapScreen.navigationOptions = {
  title: 'Background location',
};

async function getSavedLocations() {
  try {
    const item = await AsyncStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
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
});
