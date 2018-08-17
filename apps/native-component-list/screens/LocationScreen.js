import React from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native';
import { Location, Permissions } from 'expo';
import ListButton from '../components/ListButton';

export default class LocationScreen extends React.Component {
  static navigationOptions = {
    title: 'Location',
  };

  state = {
    singleLocation: null,
    singleHeading: null,
    searching: false,
    watchLocation: null,
    watchHeading: null,
    polyfill: false,
    providerStatus: null,
    subscription: null,
    headingSubscription: null,
    checkingProviderStatus: false,
  };

  _findSingleLocationWithPolyfill = () => {
    this.setState({ searching: true });
    navigator.geolocation.getCurrentPosition(
      location => {
        this.setState({ singleLocation: location, searching: false });
      },
      err => {
        console.log({ err });
        this.setState({ searching: false });
      },
      { enableHighAccuracy: true }
    );
  };

  _startWatchingLocationWithPolyfill = () => {
    let watchId = navigator.geolocation.watchPosition(
      location => {
        console.log(`Got location: ${JSON.stringify(location.coords)}`);
        this.setState({ watchLocation: location });
      },
      err => {
        console.log({ err });
      },
      {
        enableHighAccuracy: true,
        timeInterval: 1000,
        distanceInterval: 1,
      }
    );

    let subscription = {
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
      this.setState({ searching: true });
      let result = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
      });
      this.setState({ singleLocation: result });
    } finally {
      this.setState({ searching: false });
    }
  };

  _startWatchingLocation = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      return;
    }

    let subscription = await Location.watchPositionAsync(
      {
        enableHighAccuracy: true,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      location => {
        console.log(`Got location: ${JSON.stringify(location.coords)}`);
        this.setState({ watchLocation: location });
      }
    );

    this.setState({ subscription });
  };

  _stopWatchingLocation = async () => {
    this.state.subscription.remove();
    this.setState({ subscription: null, watchLocation: null });
  };

  _getSingleHeading = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      return;
    }

    const heading = await Location.getHeadingAsync();
    this.setState({ singleHeading: heading });
  };

  _startWatchingHeading = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      return;
    }

    let subscription = await Location.watchHeadingAsync(heading => {
      this.setState({ watchHeading: heading });
    });
    this.setState({ headingSubscription: subscription });
  };

  _stopWatchingHeading = async () => {
    this.state.headingSubscription.remove();
    this.setState({ headingSubscription: null, watchHeading: null });
  };

  _checkProviderStatus = async () => {
    this.setState({
      checkingProviderStatus: true,
    });
    const status = await Location.getProviderStatusAsync();
    console.log(JSON.stringify(status));
    this.setState({
      providerStatus: status,
      checkingProviderStatus: false,
    });
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
    if (this.state.searching) {
      return (
        <View style={{ padding: 10 }}>
          <ActivityIndicator />
        </View>
      );
    }

    if (this.state.singleLocation) {
      return (
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
      );
    }

    return (
      <ListButton
        onPress={
          this.state.polyfill ? this._findSingleLocationWithPolyfill : this._findSingleLocation
        }
        title="Find my location once"
      />
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
    if (this.state.singleHeading) {
      return (
        <View style={{ padding: 10 }}>
          <Text>Location.getHeadingAsync:</Text>
          <Text>Magnetic North: {this.state.singleHeading.magHeading}</Text>
          <Text>True North: {this.state.singleHeading.trueHeading}</Text>
          <Text>Accuracy: {this.state.singleHeading.accuracy}</Text>
        </View>
      );
    }

    return (
      <ListButton onPress={this._getSingleHeading} title="Find my heading (compass) heading" />
    );
  };

  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        {this._renderPolyfillSwitch()}
        {this.state.polyfill ? null : this.renderProviderStatus()}
        {this.renderSingleLocation()}
        {this.renderWatchLocation()}
        {this.renderSingleCompass()}
        {this.renderWatchCompass()}
      </ScrollView>
    );
  }
}
