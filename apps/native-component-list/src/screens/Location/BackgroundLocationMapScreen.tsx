import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import * as TaskManager from 'expo-task-manager';
import { EventEmitter, EventSubscription } from 'fbemitter';
import React from 'react';
import { AppState, AsyncStorage, Platform, StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';
import { NavigationEvents, NavigationScreenProp } from 'react-navigation';

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
  navigation: NavigationScreenProp<{}, any>;
}

interface State {
  accuracy: Location.Accuracy;
  activityType?: Location.ActivityType;
  isTracking: boolean;
  savedLocations: [];
  geofencingRegions: [];
  initialRegion?: any;
  showsBackgroundLocationIndicator: boolean;
  error?: string;
}

export default class BackgroundLocationMapScreen extends React.Component<Props, State> {
  static navigationOptions = {
    title: 'Background location',
  };

  mapViewRef = React.createRef<MapView>();

  readonly state: State = {
    accuracy: Location.Accuracy.High,
    isTracking: false,
    showsBackgroundLocationIndicator: false,
    savedLocations: [],
    geofencingRegions: [],
  };

  eventSubscription?: EventSubscription;

  didFocus = async () => {
    if (!(await Location.isBackgroundLocationAvailableAsync())) {
      alert('Background location is not available in this application.');
      this.props.navigation.goBack();
      return;
    }

    const { status } = await Permissions.askAsync(Permissions.LOCATION);

    if (status !== 'granted') {
      AppState.addEventListener('change', this.handleAppStateChange);
      this.setState({
        // tslint:disable-next-line max-line-length
        error:
          'Location permissions are required in order to use this feature. You can manually enable them at any time in the "Location Services" section of the Settings app.',
      });
      return;
    } else {
      this.setState({ error: undefined });
    }

    const { coords } = await Location.getCurrentPositionAsync();
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    const task = (await TaskManager.getRegisteredTasksAsync()).find(
      ({ taskName }) => taskName === LOCATION_UPDATES_TASK
    );
    const savedLocations = await getSavedLocations();
    const accuracy = (task && task.options.accuracy) || this.state.accuracy;

    this.eventSubscription = locationEventsEmitter.addListener('update', (locations: any) => {
      this.setState({ savedLocations: locations });
    });

    if (!isTracking) {
      alert('Click `Start tracking` to start getting location updates.');
    }

    this.setState({
      accuracy,
      activityType: task && task.options.activityType,
      isTracking,
      showsBackgroundLocationIndicator: task && task.options.showsBackgroundLocationIndicator,
      savedLocations,
      initialRegion: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.002,
      },
    });
  };

  handleAppStateChange = (nextAppState: string) => {
    if (nextAppState !== 'active') {
      return;
    }

    if (this.state.initialRegion) {
      AppState.removeEventListener('change', this.handleAppStateChange);
      return;
    }

    this.didFocus();
  };

  componentWillUnmount() {
    if (this.eventSubscription) {
      this.eventSubscription.remove();
    }
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  async startLocationUpdates(accuracy = this.state.accuracy) {
    await Location.startLocationUpdatesAsync(LOCATION_UPDATES_TASK, {
      accuracy,
      activityType: this.state.activityType,
      pausesUpdatesAutomatically: this.state.activityType != null,
      showsBackgroundLocationIndicator: this.state.showsBackgroundLocationIndicator,
      deferredUpdatesInterval: 60 * 1000, // 1 minute
      deferredUpdatesDistance: 100, // 100 meters
      foregroundService: {
        notificationTitle: 'expo-location-demo',
        notificationBody: 'Background location is running...',
        notificationColor: Colors.tintColor,
      },
    });

    if (!this.state.isTracking) {
      alert(
        // tslint:disable-next-line max-line-length
        'Now you can send app to the background, go somewhere and come back here! You can even terminate the app and it will be woken up when the new significant location change comes out.'
      );
    }
    this.setState({ isTracking: true });
  }

  async stopLocationUpdates() {
    await Location.stopLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    this.setState({ isTracking: false });
  }

  clearLocations = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    this.setState({ savedLocations: [] });
  };

  toggleTracking = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);

    if (this.state.isTracking) {
      await this.stopLocationUpdates();
    } else {
      await this.startLocationUpdates();
    }
    this.setState({ savedLocations: [] });
  };

  onAccuracyChange = () => {
    const accuracy = locationAccuracyStates[this.state.accuracy];

    this.setState({ accuracy });

    if (this.state.isTracking) {
      // Restart background task with the new accuracy.
      this.startLocationUpdates(accuracy);
    }
  };

  toggleLocationIndicator = async () => {
    const showsBackgroundLocationIndicator = !this.state.showsBackgroundLocationIndicator;

    this.setState({ showsBackgroundLocationIndicator }, async () => {
      if (this.state.isTracking) {
        await this.startLocationUpdates();
      }
    });
  };

  toggleActivityType = () => {
    if (this.state.activityType) {
      const nextActivityType = locationActivityTypes[this.state.activityType];
      this.setState({ activityType: nextActivityType });
    } else {
      this.setState({ activityType: Location.ActivityType.Other });
    }

    if (this.state.isTracking) {
      // Restart background task with the new activity type
      this.startLocationUpdates();
    }
  };

  onCenterMap = async () => {
    const { coords } = await Location.getCurrentPositionAsync();
    const mapView = this.mapViewRef.current;

    if (mapView) {
      mapView.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.002,
      });
    }
  };

  renderPolyline() {
    const { savedLocations } = this.state;

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
  }

  render() {
    if (this.state.error) {
      return <Text style={styles.errorText}>{this.state.error}</Text>;
    }

    if (!this.state.initialRegion) {
      return <NavigationEvents onDidFocus={this.didFocus} />;
    }

    return (
      <View style={styles.screen}>
        <MapView
          ref={this.mapViewRef}
          style={styles.mapView}
          initialRegion={this.state.initialRegion}
          showsUserLocation>
          {this.renderPolyline()}
        </MapView>
        <View style={styles.buttons} pointerEvents="box-none">
          <View style={styles.topButtons}>
            <View style={styles.buttonsColumn}>
              {Platform.OS === 'android' ? null : (
                <Button style={styles.button} onPress={this.toggleLocationIndicator}>
                  <View style={styles.buttonContentWrapper}>
                    <Text style={styles.text}>
                      {this.state.showsBackgroundLocationIndicator ? 'Hide' : 'Show'}
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
                  onPress={this.toggleActivityType}
                  title={
                    this.state.activityType
                      ? `Activity type: ${Location.ActivityType[this.state.activityType]}`
                      : 'No activity type'
                  }
                />
              )}
              <Button
                title={`Accuracy: ${Location.Accuracy[this.state.accuracy]}`}
                style={styles.button}
                onPress={this.onAccuracyChange}
              />
            </View>
            <View style={styles.buttonsColumn}>
              <Button style={styles.button} onPress={this.onCenterMap}>
                <MaterialIcons name="my-location" size={20} color="white" />
              </Button>
            </View>
          </View>

          <View style={styles.bottomButtons}>
            <Button title="Clear locations" style={styles.button} onPress={this.clearLocations} />
            <Button
              title={this.state.isTracking ? 'Stop tracking' : 'Start tracking'}
              style={styles.button}
              onPress={this.toggleTracking}
            />
          </View>
        </View>
      </View>
    );
  }
}

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
