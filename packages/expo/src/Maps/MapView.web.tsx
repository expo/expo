import React from 'react';
import { GoogleMap, withGoogleMap } from 'react-google-maps';
import { StyleSheet, View } from 'react-native';

import Marker from './Marker';

class GoogleMapInnerContainer extends React.Component<any> {
  render() {
    const { onMapMount, ...props } = this.props;
    return <GoogleMap {...props} ref={onMapMount} />;
  }
}

const GoogleMapContainer = withGoogleMap(GoogleMapInnerContainer);

type Props = {
  onRegionChangeComplete: Function | null;
  onPress: Function;
  onRegionChange: Function | null;
  initialRegion: { latitude: number; longitude: number };
  region: { latitude: number; longitude: number };
};

class MapView extends React.Component<Props> {
  static Marker = Marker;

  googleMap: GoogleMap | null = null;

  onMapMount = (googleMap: GoogleMap | null) => {
    this.googleMap = googleMap;
  };

  onDragEnd = () => {
    const { onRegionChangeComplete } = this.props;
    if (this.googleMap && onRegionChangeComplete) {
      const center = this.googleMap.getCenter();
      onRegionChangeComplete({ latitude: center.lat(), longitude: center.lng() });
    }
  };

  render() {
    const { region, initialRegion, onRegionChange, onPress, children } = this.props;

    return (
      <View style={styles.container}>
        <GoogleMapContainer
          onMapMount={this.onMapMount}
          containerElement={<div style={{ height: '100%' }} />}
          mapElement={<div style={{ height: '100%' }} />}
          defaultCenter={{
            lat: initialRegion.latitude,
            lng: initialRegion.longitude,
          }}
          center={{
            lat: region.latitude,
            lng: region.longitude,
          }}
          onDragStart={onRegionChange}
          onDragEnd={this.onDragEnd}
          onClick={onPress}>
          {children}
        </GoogleMapContainer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: '100vh',
  },
  containerDiv: {
    height: '100%',
  },
});

export default MapView;
