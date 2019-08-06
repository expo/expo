import React from 'react';
import { GoogleMap, withGoogleMap } from 'react-google-maps';
import { StyleSheet, View } from 'react-native';
import Marker from './Marker';
class GoogleMapInnerContainer extends React.Component {
    render() {
        const { onMapMount, ...props } = this.props;
        return <GoogleMap {...props} ref={onMapMount}/>;
    }
}
const GoogleMapContainer = withGoogleMap(GoogleMapInnerContainer);
class MapView extends React.Component {
    constructor() {
        super(...arguments);
        this.googleMap = null;
        this.onMapMount = (googleMap) => {
            this.googleMap = googleMap;
        };
        this.onDragEnd = () => {
            const { onRegionChangeComplete } = this.props;
            if (this.googleMap && onRegionChangeComplete) {
                const center = this.googleMap.getCenter();
                onRegionChangeComplete({ latitude: center.lat(), longitude: center.lng() });
            }
        };
    }
    render() {
        const { region, initialRegion, onRegionChange, onPress, children } = this.props;
        return (<View style={styles.container}>
        <GoogleMapContainer onMapMount={this.onMapMount} containerElement={<div style={{ height: '100%' }}/>} mapElement={<div style={{ height: '100%' }}/>} defaultCenter={{
            lat: initialRegion.latitude,
            lng: initialRegion.longitude,
        }} center={{
            lat: region.latitude,
            lng: region.longitude,
        }} onDragStart={onRegionChange} onDragEnd={this.onDragEnd} onClick={onPress}>
          {children}
        </GoogleMapContainer>
      </View>);
    }
}
MapView.Marker = Marker;
const styles = StyleSheet.create({
    container: {
        height: '100vh',
    },
    containerDiv: {
        height: '100%',
    },
});
export default MapView;
//# sourceMappingURL=MapView.web.js.map