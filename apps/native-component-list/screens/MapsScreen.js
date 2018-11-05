import React from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MapView } from 'expo';
import Layout from '../constants/Layout';
import ListButton from '../components/ListButton';

const REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const getRandomFloat = (min, max) => {
  return Math.random() * (max - min) + min;
};

export default class MapsScreen extends React.Component {
  static navigationOptions = {
    title: '<MapView />',
  };

  state = {
    isGoogleMap: false,
  };

  render() {
    let providerProps = this.state.isGoogleMap ? { provider: 'google' } : {};
    return (
      <ScrollView style={StyleSheet.absoluteFill}>
        <MapView
          ref={ref => {
            this._mapView = ref;
          }}
          style={{ width: Layout.window.width, height: 300 }}
          initialRegion={REGION}
          {...providerProps}
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
          onValueChange={isGoogleMap => {
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
      <View style={{paddingHorizontal: 10}}>
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
      if (Platform.OS === 'ios' && this.state.isGoogleMap) {
        alert('animateToViewingAngle is not currently supported with Google Maps on iOS');
      } else {
        this._mapView.animateToViewingAngle(getRandomFloat(0, 90));
      }
    }
  };

  _animateToRandomCoord = () => {
    if (this._mapView) {
      this._mapView.animateToCoordinate({
        latitude: REGION.latitude + (Math.random() - 0.5) * (REGION.latitudeDelta / 2),
        longitude: REGION.longitude + (Math.random() - 0.5) * (REGION.longitudeDelta / 2),
      });
    }
  };
}
