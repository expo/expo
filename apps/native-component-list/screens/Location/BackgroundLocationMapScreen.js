import React from 'react';
import { EventEmitter } from 'fbemitter';
import { NavigationEvents } from 'react-navigation';
import { AsyncStorage, StyleSheet, Text, View } from 'react-native';
import { BlurView, Location, MapView, Notifications, TaskManager } from 'expo';

import Button from '../../components/Button';
import Colors from '../../constants/Colors';

const STORAGE_KEY = 'ncl-locations';
const LOCATION_UPDATES_TASK = 'location-updates';
const GEOFENCING_TASK = 'geofencing';

const locationEventsEmitter = new EventEmitter();

export default class BackgroundLocationMapScreen extends React.Component {
  static navigationOptions = {
    title: 'Location Map',
  };

  mapViewRef = React.createRef();

  state = {
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
    const isGeofencing = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);
    const savedLocations = await getSavedLocations();
    const geofencingRegions = await getSavedRegions();

    this.eventSubscription = locationEventsEmitter.addListener('update', locations => {
      this.setState({ savedLocations: locations });
    });

    this.setState({
      isWatching,
      isGeofencing,
      savedLocations,
      geofencingRegions,
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

  toggleWatching = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);

    if (this.state.isWatching) {
      await Location.stopLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    } else {
      await Location.startLocationUpdatesAsync(LOCATION_UPDATES_TASK, {
        accuracy: Location.Accuracy.BEST_FOR_NAVIGATION,
        showsBackgroundLocationIndicator: false,
      });
    }
    this.setState({ isWatching: !this.state.isWatching, savedLocations: [] });
  };

  toggleGeofencing = async () => {
    if (this.state.isGeofencing) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      this.setState({ geofencingRegions: [] });
    } else {
      await Location.startGeofencingAsync(GEOFENCING_TASK, this.state.geofencingRegions);
    }
    this.setState({ isGeofencing: !this.state.isGeofencing });
  };

  centerMap = async () => {
    const { coords } = await Location.getCurrentPositionAsync();
    const mapView = this.mapViewRef.current;

    if (mapView) {
      mapView.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.02,
      });
    }
  };

  onMapPress = async ({ nativeEvent: { coordinate } }) => {
    const geofencingRegions = [...this.state.geofencingRegions];

    geofencingRegions.push({
      identifier: `${coordinate.latitude},${coordinate.longitude}`,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      radius: 50,
    });
    this.setState({ geofencingRegions });

    if (await Location.hasStartedGeofencingAsync(GEOFENCING_TASK)) {
      // update existing geofencing task
      await Location.startGeofencingAsync(GEOFENCING_TASK, geofencingRegions);
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

  renderRegions() {
    const { geofencingRegions } = this.state;

    return geofencingRegions.map(region => {
      return (
        <MapView.Circle
          key={region.identifier}
          center={region}
          radius={region.radius}
          strokeColor="rgba(78,155,222,0.8)"
          fillColor="rgba(78,155,222,0.2)"
        />
      );
    });
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
                : 'Click `Start recording` to start getting location updates.'
              }
            </Text>
          </BlurView>
        </View>

        <MapView
          ref={this.mapViewRef}
          style={styles.mapView}
          initialRegion={this.state.initialRegion}
          onPress={this.onMapPress}
          showUsersLocation>
          {this.renderPolyline()}
          {this.renderRegions()}
        </MapView>
        <View style={styles.buttons}>
          <View style={styles.leftButtons}>
            <Button
              buttonStyle={styles.button}
              title={this.state.isWatching ? 'Stop recording' : 'Start recording'}
              onPress={this.toggleWatching}
            />
            <Button
              disabled={this.state.geofencingRegions.length === 0}
              buttonStyle={styles.button}
              title={this.state.isGeofencing ? 'Stop geofencing' : 'Start geofencing'}
              onPress={this.toggleGeofencing}
            />
          </View>
          <Button
            buttonStyle={styles.button}
            title="Center"
            onPress={this.centerMap}
          />
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

async function getSavedRegions() {
  const tasks = await TaskManager.getRegisteredTasksAsync();
  return tasks[GEOFENCING_TASK] ? tasks[GEOFENCING_TASK].regions : [];
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

TaskManager.defineTask(GEOFENCING_TASK, async ({ data: { region } }) => {
  console.log(`${region.state} region ${region.identifier}`);

  await Notifications.presentLocalNotificationAsync({
    title: 'Expo Geofencing',
    body: `You're ${region.state} a region ${region.identifier}`,
    data: region,
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
