import MaterialIcons from '@expo/vector-icons/build/MaterialIcons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as React from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Circle, MapPressEvent } from 'react-native-maps';

import NavigationEvents from '../../components/NavigationEvents';
import Button from '../../components/PrimaryButton';
import { StyledText } from '../../components/Text';

const GEOFENCING_TASK = 'geofencing';
const REGION_RADIUSES = [30, 50, 75, 100, 150, 200];

type Region = {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
};

type State = {
  isGeofencing: boolean;
  newRegionRadius: number;
  geofencingRegions: Region[];
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  error: string | null;
};

type Props = unknown;

export default class GeofencingScreen extends React.Component<Props, State> {
  mapViewRef = React.createRef<MapView>();

  appStateSubscription?: NativeEventSubscription;

  readonly state: State = {
    isGeofencing: false,
    newRegionRadius: REGION_RADIUSES[1],
    geofencingRegions: [],
    initialRegion: null,
    error: null,
  };

  didFocus = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
      this.setState({
        error:
          'Location permissions are required in order to use this feature. You can manually enable them at any time in the "Location Services" section of the Settings app.',
      });
      return;
    } else {
      this.setState({ error: null });
    }

    const { coords } = await Location.getCurrentPositionAsync();
    const isGeofencing = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);
    const geofencingRegions = await getSavedRegions();

    if (!isGeofencing) {
      alert(
        'Tap on the map to select a region with chosen radius and then press `Start geofencing` to start getting geofencing notifications.'
      );
    }

    this.setState({
      isGeofencing,
      geofencingRegions,
      initialRegion: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.002,
      },
    });
  };

  handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState !== 'active') {
      return;
    }

    if (this.state.initialRegion) {
      if (this.appStateSubscription != null) {
        this.appStateSubscription.remove();
        this.appStateSubscription = undefined;
      }
      return;
    }

    this.didFocus();
  };

  canToggleGeofencing() {
    return this.state.isGeofencing || this.state.geofencingRegions.length > 0;
  }

  toggleGeofencing = async () => {
    if (!this.canToggleGeofencing()) {
      return;
    }

    if (this.state.isGeofencing) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      this.setState({ geofencingRegions: [] });
    } else {
      await Location.startGeofencingAsync(GEOFENCING_TASK, this.state.geofencingRegions);
      alert(
        'You will be receiving notifications when the device enters or exits from selected regions.'
      );
    }
    this.setState((state) => ({ isGeofencing: !state.isGeofencing }));
  };

  shiftRegionRadius = () => {
    const index = REGION_RADIUSES.indexOf(this.state.newRegionRadius) + 1;
    const radius = index < REGION_RADIUSES.length ? REGION_RADIUSES[index] : REGION_RADIUSES[0];

    this.setState({ newRegionRadius: radius });
  };

  centerMap = async () => {
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

  onMapPress = ({ nativeEvent: { coordinate } }: MapPressEvent) => {
    this.setState(
      (state) => ({
        geofencingRegions: [
          ...state.geofencingRegions,
          {
            identifier: `${coordinate.latitude},${coordinate.longitude}`,
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            radius: state.newRegionRadius,
          },
        ],
      }),
      async () => {
        if (await Location.hasStartedGeofencingAsync(GEOFENCING_TASK)) {
          // update existing geofencing task
          await Location.startGeofencingAsync(GEOFENCING_TASK, this.state.geofencingRegions);
        }
      }
    );
  };

  renderRegions() {
    const { geofencingRegions } = this.state;

    return geofencingRegions.map((region) => {
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
  }

  getGeofencingButtonContent() {
    const canToggle = this.canToggleGeofencing();

    if (canToggle) {
      return this.state.isGeofencing ? 'Stop geofencing' : 'Start geofencing';
    }
    return 'Select at least one region on the map';
  }

  render() {
    if (this.state.error) {
      return <StyledText style={styles.errorText}>{this.state.error}</StyledText>;
    }

    if (!this.state.initialRegion) {
      return <NavigationEvents onDidFocus={this.didFocus} />;
    }

    const canToggle = this.canToggleGeofencing();

    return (
      <View style={styles.screen}>
        <View style={styles.buttons} pointerEvents="box-none">
          <View style={styles.topButtons}>
            <View style={styles.buttonsColumn}>
              <Button style={styles.button} onPress={this.shiftRegionRadius}>
                {`Radius: ${this.state.newRegionRadius}m`}
              </Button>
            </View>
            <View style={styles.buttonsColumn}>
              <Button style={styles.button} onPress={this.centerMap}>
                <MaterialIcons name="my-location" size={20} color="white" />
              </Button>
            </View>
          </View>

          <View style={styles.bottomButtons}>
            <Button
              style={[styles.button, canToggle ? null : styles.disabledButton]}
              onPress={this.toggleGeofencing}>
              {this.getGeofencingButtonContent()}
            </Button>
          </View>
        </View>
      </View>
    );
  }
}

async function getSavedRegions() {
  const tasks = await TaskManager.getRegisteredTasksAsync();
  const task = tasks.find(({ taskName }) => taskName === GEOFENCING_TASK);
  return task ? task.options.regions : [];
}

if (Platform.OS !== 'android') {
  TaskManager.defineTask(GEOFENCING_TASK, async ({ data: { region } }: any) => {
    const stateString = Location.GeofencingRegionState[region.state].toLowerCase();
    const body = `You're ${stateString} a region with latitude: ${region.latitude}, longitude: ${region.longitude} and radius: ${region.radius}m`;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Expo Geofencing',
        body,
        data: {
          ...region,
          notificationBody: body,
          notificationType: GEOFENCING_TASK,
        },
      },
      trigger: null,
    });
  });
}

Notifications.addNotificationResponseReceivedListener((response) => {
  if (response.notification.request.content.data?.notificationType === GEOFENCING_TASK) {
    alert(response.notification.request.content.data.notificationBody);
  }
});
Notifications.addNotificationReceivedListener((notification) => {
  if (notification.request.content.data?.notificationType === GEOFENCING_TASK) {
    alert(notification.request.content.data.notificationBody);
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
  disabledButton: {
    backgroundColor: 'gray',
    opacity: 0.8,
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.7)',
    margin: 20,
  },
});
