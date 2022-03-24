import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import * as TaskManager from 'expo-task-manager';
import { EventEmitter, EventSubscription } from 'fbemitter';
import * as React from 'react';
import { AppState, AppStateStatus, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';

import NavigationEvents from '../components/NavigationEvents';
import Button from '../components/PrimaryButton';
import Colors from '../constants/Colors';

const STORAGE_KEY = 'expo-home-locations';
const LOCATION_UPDATES_TASK = 'location-updates';

const locationEventsEmitter = new EventEmitter();

type Region = {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
};

type State = {
  isBackgroundLocationAvailable: null | boolean;
  accuracy: Location.Accuracy;
  isTracking: boolean;
  showsBackgroundLocationIndicator: boolean;
  savedLocations: Region[];
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  error: string | null;
};

type Props = unknown;

export default class LocationDiagnosticsScreen extends React.Component<Props, State> {
  mapViewRef = React.createRef<MapView>();

  eventSubscription?: EventSubscription;

  readonly state: State = {
    isBackgroundLocationAvailable: null,
    accuracy: Location.Accuracy.High,
    isTracking: false,
    showsBackgroundLocationIndicator: false,
    savedLocations: [],
    initialRegion: null,
    error: null,
  };

  componentDidMount() {
    this.checkBackgroundLocationAvailability();
  }

  async checkBackgroundLocationAvailability() {
    const isBackgroundLocationAvailable = await Location.isBackgroundLocationAvailableAsync();
    this.setState({ isBackgroundLocationAvailable });
  }

  didFocus = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);

    if (status !== 'granted') {
      AppState.addEventListener('change', this.handleAppStateChange);
      this.setState({
        error:
          'Location permissions are required in order to use this feature. You can manually enable them at any time in the "Location Services" section of the Settings app.',
      });
      return;
    } else {
      this.setState({ error: null });
    }

    const { coords } = await Location.getCurrentPositionAsync();
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    const task = (await TaskManager.getRegisteredTasksAsync()).find(
      ({ taskName }) => taskName === LOCATION_UPDATES_TASK
    );
    const savedLocations = await getSavedLocations();

    this.eventSubscription = locationEventsEmitter.addListener('update', (locations: Region[]) => {
      this.setState({ savedLocations: locations });
    });

    if (!isTracking) {
      alert('Click `Start tracking` to start getting location updates.');
    }

    this.setState((state) => ({
      accuracy: (task && task.options.accuracy) || state.accuracy,
      isTracking,
      savedLocations,
      initialRegion: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.002,
      },
    }));
  };

  handleAppStateChange = (nextAppState: AppStateStatus) => {
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
      showsBackgroundLocationIndicator: this.state.showsBackgroundLocationIndicator,
    });

    if (!this.state.isTracking) {
      alert(
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
    const next = Location.Accuracy[this.state.accuracy + 1];
    const accuracy = next
      ? (Location.Accuracy[next as any] as any as Location.Accuracy)
      : Location.Accuracy.Lowest;

    this.setState({ accuracy });

    if (this.state.isTracking) {
      // Restart background task with the new accuracy.
      this.startLocationUpdates(accuracy);
    }
  };

  toggleLocationIndicator = async () => {
    this.setState(
      (state) => ({ showsBackgroundLocationIndicator: !state.showsBackgroundLocationIndicator }),
      async () => {
        if (this.state.isTracking) {
          await this.startLocationUpdates();
        }
      }
    );
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
      <Polyline coordinates={savedLocations} strokeWidth={3} strokeColor={Colors.light.tintColor} />
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
              {this.state.isBackgroundLocationAvailable && (
                <Button style={styles.button} onPress={this.toggleLocationIndicator}>
                  <Text>{this.state.showsBackgroundLocationIndicator ? 'Hide' : 'Show'}</Text>
                  <Text> background </Text>
                  <FontAwesome name="location-arrow" size={20} color="white" />
                  <Text> indicator</Text>
                </Button>
              )}
              <Button style={styles.button} onPress={this.onAccuracyChange}>
                {`Accuracy: ${Location.Accuracy[this.state.accuracy]}`}
              </Button>
            </View>
            <View style={styles.buttonsColumn}>
              <Button style={styles.button} onPress={this.onCenterMap}>
                <MaterialIcons name="my-location" size={20} color="white" />
              </Button>
            </View>
          </View>

          <View style={styles.bottomButtons}>
            <Button style={styles.button} onPress={this.clearLocations}>
              Clear locations
            </Button>
            {this.state.isBackgroundLocationAvailable && (
              <Button style={styles.button} onPress={this.toggleTracking}>
                {this.state.isTracking ? 'Stop tracking' : 'Start tracking'}
              </Button>
            )}
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
  } catch {
    return [];
  }
}

if (Platform.OS !== 'android') {
  TaskManager.defineTask(LOCATION_UPDATES_TASK, async ({ data: { locations } }: any) => {
    if (locations && locations.length > 0) {
      const savedLocations = await getSavedLocations();
      const newLocations = locations.map(({ coords }: { coords: any }) => ({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));

      savedLocations.push(...newLocations);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedLocations));

      locationEventsEmitter.emit('update', savedLocations);
    }
  });
}

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
  errorText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.7)',
    margin: 20,
  },
});
