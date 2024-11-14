import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import MapView from 'react-native-maps';

import ListButton from '../components/ListButton';
import Layout from '../constants/Layout';

const REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const getRandomFloat = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

interface State {
  isGoogleMap: boolean;
}

export default class MapsScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: '<MapView />',
  };

  readonly state: State = {
    isGoogleMap: false,
  };

  _mapView?: MapView | null;

  render() {
    const provider: 'google' | undefined = this.state.isGoogleMap ? 'google' : undefined;
    return (
      <ScrollView style={StyleSheet.absoluteFill}>
        <MapView
          ref={(ref) => {
            this._mapView = ref;
          }}
          style={{ width: Layout.window.width, height: 300 }}
          initialRegion={REGION}
          provider={provider}
        />
        {this._renderGoogleMapsSwitch()}
        {this._renderJumpToCoordButton()}
      </ScrollView>
    );
  }

  _renderGoogleMapsSwitch = () => {
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
          onValueChange={(isGoogleMap) => {
            this.setState({ isGoogleMap });
          }}
          value={this.state.isGoogleMap}
        />
        <Text style={{ fontSize: 18 }}>Use Google maps</Text>
      </View>
    );
  };

  _renderJumpToCoordButton = () => {
    return (
      <View style={{ paddingHorizontal: 10 }}>
        <ListButton onPress={this._animateToRandomCoord} title="Animate to random SF Coord" />
        <ListButton
          onPress={this._animateToRandomViewingAngle}
          title="Animate to random Viewing Angle"
        />
      </View>
    );
  };

  _animateToRandomViewingAngle = () => {
    if (this._mapView) {
      this._mapView.animateCamera({
        pitch: getRandomFloat(0, 90),
      });
    }
  };

  _animateToRandomCoord = () => {
    if (this._mapView) {
      this._mapView.animateCamera({
        center: {
          latitude: REGION.latitude + (Math.random() - 0.5) * (REGION.latitudeDelta / 2),
          longitude: REGION.longitude + (Math.random() - 0.5) * (REGION.longitudeDelta / 2),
        },
      });
    }
  };
}
