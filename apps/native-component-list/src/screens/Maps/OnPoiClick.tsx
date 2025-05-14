import React from 'react';
import {StyleSheet, View, Text, Dimensions} from 'react-native';

import MapView, {Callout, Marker} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

class OnPoiClick extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      poi: null,
    };

    this.onPoiClick = this.onPoiClick.bind(this);
  }

  onPoiClick(e: any) {
    const poi = e.nativeEvent;

    this.setState({
      poi,
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          initialRegion={this.state.region}
          onPoiClick={this.onPoiClick}>
          {this.state.poi && (
            <Marker coordinate={this.state.poi.coordinate}>
              <Callout>
                <View>
                  <Text>Place Id: {this.state.poi.placeId}</Text>
                  <Text>Name: {this.state.poi.name}</Text>
                </View>
              </Callout>
            </Marker>
          )}
        </MapView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default OnPoiClick;
