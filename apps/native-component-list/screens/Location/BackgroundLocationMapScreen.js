import React from 'react';
import { EventEmitter } from 'fbemitter';
import { NavigationEvents } from 'react-navigation';
import { AsyncStorage, StyleSheet, Text, View } from 'react-native';
import { BlurView, Location, MapView, TaskManager } from 'expo';

import Button from '../../components/Button';
import Colors from '../../constants/Colors';

const STORAGE_KEY = 'ncl-locations';
const LOCATION_UPDATES_TASK = 'location-updates';

const locationEventsEmitter = new EventEmitter();

export default class BackgroundLocationMapScreen extends React.Component {
  static navigationOptions = {
    title: 'Location Map',
  };

  mapViewRef = React.createRef();

  state = {
    accuracy: Location.Accuracy.High,
    isWatching: false,
    isGeofencing: false,
    savedLocations: [],
    geofencingRegions: [],
    initialRegion: null,
  };

  didFocus = async () => {
    await Location.requestPermissionsAsync();

    const { coords } = await Location.getCurrentPositionAsync();
    const isWatching = await Location.hasStartedLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    const task = (await TaskManager.getRegisteredTasksAsync()).find(
      ({ taskName }) => taskName === LOCATION_UPDATES_TASK
    );
    const savedLocations = await getSavedLocations();
    const accuracy = (task && task.options.accuracy) || this.state.accuracy;

    this.eventSubscription = locationEventsEmitter.addListener('update', locations => {
      this.setState({ savedLocations: locations });
    });

    this.setState({
      accuracy,
      isWatching,
      savedLocations,
      initialRegion: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.002,
      },
    });
  };

  componentWillUnmount() {
    if (this.eventSubscription) {
      this.eventSubscription.remove();
    }
  }

  async startLocationUpdates(accuracy = this.state.accuracy) {
    await Location.startLocationUpdatesAsync(LOCATION_UPDATES_TASK, {
      accuracy,
      showsBackgroundLocationIndicator: false,
      deferredUpdatesInterval: 60 * 1000, // 1 minute
      deferredUpdatesDistance: 100, // 100 meters
    });
    this.setState({ isWatching: true });
  }

  async stopLocationUpdates() {
    await Location.stopLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    this.setState({ isWatching: false });
  }

  toggleWatching = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);

    if (this.state.isWatching) {
      await this.stopLocationUpdates();
    } else {
      await this.startLocationUpdates();
    }
    this.setState({ savedLocations: [] });
  };

  onAccuracyChange = () => {
    const next = Location.Accuracy[this.state.accuracy + 1];
    const accuracy = next ? Location.Accuracy[next] : Location.Accuracy.Lowest;

    this.setState({ accuracy });

    if (this.state.isWatching) {
      // Restart background task with the new accuracy.
      this.startLocationUpdates(accuracy);
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
      <MapView.Polyline
        coordinates={savedLocations}
        strokeWidth={3}
        strokeColor={Colors.tintColor}
      />
    );
  }

  render() {
    if (!this.state.initialRegion) {
      return <NavigationEvents onDidFocus={this.didFocus} />;
    }

    return (
      <View style={styles.screen}>
        <View style={styles.heading}>
          <BlurView tint="light" intensity={70} style={styles.blurView}>
            <Text style={styles.headingText}>
              { this.state.isWatching
                ? 'Now you can send app to the background, go somewhere and come back here! You can even terminate the app and it will be woken up when the new significant location change comes out.'
                : 'Click `Start watching` to start getting location updates.'
              }
            </Text>
          </BlurView>
        </View>

        <MapView
          ref={this.mapViewRef}
          style={styles.mapView}
          initialRegion={this.state.initialRegion}
          showsUserLocation>
          {this.renderPolyline()}
        </MapView>
        <View style={styles.buttons}>
          <View style={styles.leftButtons}>
            <Button
              buttonStyle={styles.button}
              title={this.state.isWatching ? 'Stop watching' : 'Start watching'}
              onPress={this.toggleWatching}
            />
            <Button
              buttonStyle={styles.button}
              title={`Accuracy: ${Location.Accuracy[this.state.accuracy]}`}
              onPress={this.onAccuracyChange}
            />
          </View>
          <Button buttonStyle={styles.button} title="Center" onPress={this.onCenterMap} />
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

TaskManager.defineTask(LOCATION_UPDATES_TASK, async ({ data: { locations } }) => {
  console.log('Received new locations:', locations);

  if (locations && locations.length > 0) {
    const savedLocations = await getSavedLocations();
    const newLocations = locations.map(({ coords }) => ({
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));

    savedLocations.push(...newLocations);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedLocations));

    locationEventsEmitter.emit('update', savedLocations);
  }
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
