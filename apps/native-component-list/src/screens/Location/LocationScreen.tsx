import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { NavigationScreenProps } from 'react-navigation';

import ListButton from '../../components/ListButton';

type OmitNested<T, K1 extends keyof T, K2 extends keyof T[K1]> = Pick<T, Exclude<keyof T, K1>> &
  { [P1 in K1]: Pick<T[K1], Exclude<keyof T[K1], K2>> };

type CleanedPosition = OmitNested<Position, 'coords', 'altitudeAccuracy'>;

interface State {
  singleLocation?: CleanedPosition;
  singleHeading?: Location.HeadingData;
  searchingLocation: boolean;
  searchingHeading: boolean;
  watchLocation?: CleanedPosition;
  watchHeading?: Location.HeadingData;
  polyfill: boolean;
  providerStatus?: Location.ProviderStatus;
  subscription?: { remove: () => void };
  headingSubscription?: { remove: () => void };
  checkingProviderStatus: boolean;
}

export default class LocationScreen extends React.Component<NavigationScreenProps, State> {
  static navigationOptions = {
    title: 'Location',
  };

  readonly state: State = {
    searchingLocation: false,
    searchingHeading: false,
    polyfill: false,
    checkingProviderStatus: false,
  };

  _cleanPosition = (position: Position): CleanedPosition => {
    const {
      coords: { altitudeAccuracy, ...restCoords },
      ...restPosition
    } = position;
    return {
      coords: restCoords,
      ...restPosition,
    };
  };

  _findSingleLocationWithPolyfill = () => {
    this.setState({ searchingLocation: true });
    navigator.geolocation.getCurrentPosition(
      location => {
        this.setState({ singleLocation: this._cleanPosition(location), searchingLocation: false });
      },
      err => {
        // tslint:disable-next-line no-console
        console.log({ err });
        this.setState({ searchingLocation: false });
      },
      { enableHighAccuracy: true }
    );
  };

  _startWatchingLocationWithPolyfill = () => {
    const watchId = navigator.geolocation.watchPosition(
      location => {
        // tslint:disable-next-line no-console
        console.log(`Got location: ${JSON.stringify(location.coords)}`);
        this.setState({ watchLocation: this._cleanPosition(location) });
      },
      err => {
        // tslint:disable-next-line no-console
        console.log({ err });
      },
      {
        enableHighAccuracy: true,
        // @ts-ignore
        timeInterval: 1000,
        distanceInterval: 1,
      }
    );

    const subscription = {
      remove() {
        navigator.geolocation.clearWatch(watchId);
      },
    };

    this.setState({ subscription });
  };

  _findSingleLocation = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      return;
    }

    try {
      this.setState({ searchingLocation: true });
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      this.setState({ singleLocation: result, searchingLocation: false });
    } finally {
      this.setState({ searchingLocation: false });
    }
  };

  _startWatchingLocation = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      return;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      location => {
        // tslint:disable-next-line no-console
        console.log(`Got location: ${JSON.stringify(location.coords)}`);
        this.setState({ watchLocation: location });
      }
    );

    this.setState({ subscription });
  };

  _stopWatchingLocation = async () => {
    this.state.subscription!.remove();
    this.setState({ subscription: undefined, watchLocation: undefined });
  };

  _getSingleHeading = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      return;
    }

    try {
      this.setState({ searchingHeading: true });
      const heading = await Location.getHeadingAsync();
      this.setState({ singleHeading: heading, searchingHeading: false });
    } finally {
      this.setState({ searchingHeading: false });
    }
  };

  _startWatchingHeading = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      return;
    }

    const subscription = await Location.watchHeadingAsync(heading => {
      this.setState({ watchHeading: heading });
    });
    this.setState({ headingSubscription: subscription });
  };

  _stopWatchingHeading = async () => {
    this.state.headingSubscription!.remove();
    this.setState({ headingSubscription: undefined, watchHeading: undefined });
  };

  _checkProviderStatus = async () => {
    this.setState({
      checkingProviderStatus: true,
    });
    const status = await Location.getProviderStatusAsync();
    // tslint:disable-next-line no-console
    console.log(JSON.stringify(status));
    this.setState({
      providerStatus: status,
      checkingProviderStatus: false,
    });
  };

  _goToBackgroundLocationMap = () => {
    this.props.navigation.navigate('BackgroundLocationMap');
  };

  _goToGeofencingMap = () => {
    this.props.navigation.navigate('Geofencing');
  };

  _renderPolyfillSwitch = () => {
    return (
      <View
        style={{
          flexDirection: 'row',
          height: 50,
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: 10,
          paddingRight: 30,
        }}>
        <Switch
          style={{ marginHorizontal: 10 }}
          onValueChange={polyfill => {
            this.setState({ polyfill });
          }}
          value={this.state.polyfill}
        />
        <Text style={{ fontSize: 12 }}>Use navigator.geolocation polyfill</Text>
      </View>
    );
  };

  renderSingleLocation = () => {
    if (this.state.searchingLocation) {
      return (
        <View style={styles.activityIndicatorWrapper}>
          <ActivityIndicator />
          <Text>Searching for location...</Text>
        </View>
      );
    }

    return (
      <View>
        {this.state.singleLocation && (
          <View style={{ padding: 10 }}>
            <Text>
              {this.state.polyfill
                ? 'navigator.geolocation.getCurrentPosition'
                : 'Location.getCurrentPositionAsync'}
              :
            </Text>
            <Text>Latitude: {this.state.singleLocation.coords.latitude}</Text>
            <Text>Longitude: {this.state.singleLocation.coords.longitude}</Text>
          </View>
        )}
        <ListButton
          onPress={
            this.state.polyfill ? this._findSingleLocationWithPolyfill : this._findSingleLocation
          }
          title="Find my location once"
        />
      </View>
    );
  };

  renderProviderStatus = () => {
    if (this.state.checkingProviderStatus) {
      return (
        <View style={{ padding: 10 }}>
          <ActivityIndicator />
        </View>
      );
    }

    if (this.state.providerStatus) {
      return (
        <View style={{ padding: 10 }}>
          <Text>Enabled: {String(this.state.providerStatus.locationServicesEnabled)}</Text>
          <Text>GPS Available: {String(this.state.providerStatus.gpsAvailable)}</Text>
          <Text>Network Available: {String(this.state.providerStatus.networkAvailable)}</Text>
          <Text>Passive Available: {String(this.state.providerStatus.passiveAvailable)}</Text>
        </View>
      );
    }

    return <ListButton onPress={this._checkProviderStatus} title="Check provider status" />;
  };

  renderWatchLocation = () => {
    if (this.state.watchLocation) {
      return (
        <View>
          <Text>
            {this.state.polyfill
              ? 'navigator.geolocation.watchPosition'
              : 'Location.watchPositionAsync'}
            :
          </Text>
          <Text>Latitude: {this.state.watchLocation.coords.latitude}</Text>
          <Text>Longitude: {this.state.watchLocation.coords.longitude}</Text>
          <ListButton onPress={this._stopWatchingLocation} title="Stop Watching Location" />
        </View>
      );
    } else if (this.state.subscription) {
      return (
        <View style={{ padding: 10 }}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <ListButton
        onPress={
          this.state.polyfill
            ? this._startWatchingLocationWithPolyfill
            : this._startWatchingLocation
        }
        title="Watch my location"
      />
    );
  };

  renderWatchCompass = () => {
    if (this.state.watchHeading) {
      return (
        <View>
          <Text>Location.watchHeadingAsync:</Text>
          <Text>Magnetic North: {this.state.watchHeading.magHeading}</Text>
          <Text>True North: {this.state.watchHeading.trueHeading}</Text>
          <Text>Accuracy: {this.state.watchHeading.accuracy}</Text>
          <ListButton onPress={this._stopWatchingHeading} title="Stop Watching Heading" />
        </View>
      );
    }

    return <ListButton onPress={this._startWatchingHeading} title="Watch my heading (compass)" />;
  };

  renderSingleCompass = () => {
    if (this.state.searchingHeading) {
      return (
        <View style={styles.activityIndicatorWrapper}>
          <ActivityIndicator />
          <Text>Searching for heading...</Text>
        </View>
      );
    }

    return (
      <View>
        {this.state.singleHeading && (
          <View style={{ padding: 10 }}>
            <Text>Location.getHeadingAsync:</Text>
            <Text>Magnetic North: {this.state.singleHeading.magHeading}</Text>
            <Text>True North: {this.state.singleHeading.trueHeading}</Text>
            <Text>Accuracy: {this.state.singleHeading.accuracy}</Text>
          </View>
        )}
        <ListButton onPress={this._getSingleHeading} title="Find my heading (compass) heading" />
      </View>
    );
  };

  renderLocationMapButton() {
    return (
      <View>
        <ListButton onPress={this._goToBackgroundLocationMap} title="Background location map" />
        <ListButton onPress={this._goToGeofencingMap} title="Geofencing map" />
      </View>
    );
  }

  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        {this._renderPolyfillSwitch()}
        {this.state.polyfill ? null : this.renderProviderStatus()}
        {this.renderSingleLocation()}
        {this.renderWatchLocation()}
        {this.renderSingleCompass()}
        {this.renderWatchCompass()}
        {this.renderLocationMapButton()}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  activityIndicatorWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
  },
});
