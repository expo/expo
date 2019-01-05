import React from 'react';
import { GoogleMap, withGoogleMap } from 'react-google-maps';
import { StyleSheet, View } from 'react-native';

import Marker from './Marker';

// {
//   handleMapMounted: string | ((instance: GoogleMap | null) => void);
// }
class GoogleMapInnerContainer extends React.Component<any> {
  render() {
    const { handleMapMounted, ...props } = this.props;
    return <GoogleMap {...props} ref={handleMapMounted} />;
  }
}

const GoogleMapContainer = withGoogleMap(GoogleMapInnerContainer);

type Props = {
  onRegionChangeComplete: Function | null;
  onPress: Function;
  onRegionChange: Function | null;
};

type State = {
  center: { lat: number; lng: number };
};

class MapView extends React.Component<Props, State> {
  static Marker = Marker;

  googleMap: GoogleMap | null = null;

  constructor(props) {
    super(props);
    const { region, initialRegion = {} } = props;
    const finalRegion = region || initialRegion;
    this.state = { center: { lat: finalRegion.latitude, lng: finalRegion.longitude } };
  }

  handleMapMounted = (googleMap: GoogleMap | null) => {
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
    const { onRegionChange, onPress, children } = this.props;
    return (
      <View style={styles.container}>
        <GoogleMapContainer
          handleMapMounted={this.handleMapMounted}
          containerElement={<div style={{ height: '100%' }} />}
          mapElement={<div style={{ height: '100%' }} />}
          center={this.state.center}
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
