import React from 'react';
import {StyleSheet, View, Text, Dimensions} from 'react-native';

import MapView, {MAP_TYPES, WMSTile} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 63.5;
const LONGITUDE = 23.5;
const LATITUDE_DELTA = 0.152;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

class WMSTiles extends React.Component<any, any> {
  constructor(props: any, context: any) {
    super(props, context);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      isWMSTilesActive: false,
    };
  }

  toggleWMSTiles() {
    this.setState({isWMSTilesActive: !this.state.isWMSTilesActive});
  }

  render() {
    const {region} = this.state;
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          mapType={MAP_TYPES.SATELLITE}
          style={styles.map}
          initialRegion={region}>
          {this.state.isWMSTilesActive && (
            <WMSTile
              urlTemplate="https://julkinen.vayla.fi/inspirepalvelu/wms?service=WMS&version=1.1.1&request=GetMap&layers=avoin:TL137&format=image/png&transparent=true&styles=&bbox={minX},{minY},{maxX},{maxY}&width={width}&height={height}&srs=EPSG:3857"
              zIndex={1}
              opacity={0.5}
              tileSize={512}
            />
          )}
        </MapView>
        <View style={styles.buttonContainer}>
          <View style={styles.bubble}>
            <Text onPress={() => this.toggleWMSTiles()}>
              WMS Tiles: {this.state.isWMSTilesActive ? 'on' : 'off'} (click to
              toggle)
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  latlng: {
    width: 200,
    alignItems: 'stretch',
  },
  button: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});

export default WMSTiles;
