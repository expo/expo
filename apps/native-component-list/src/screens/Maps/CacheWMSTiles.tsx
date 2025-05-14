import React from 'react';
import {StyleSheet, View, Text, Dimensions} from 'react-native';

import MapView, {MAP_TYPES, PROVIDER_DEFAULT, WMSTile} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 63.5;
const LONGITUDE = 23.5;
const LATITUDE_DELTA = 0.152;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

class CustomTiles extends React.Component<any, any> {
  constructor(props: any, context: any) {
    super(props, context);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
    };
  }

  get mapType() {
    // MapKit does not support 'none' as a base map
    return this.props.provider === PROVIDER_DEFAULT
      ? MAP_TYPES.STANDARD
      : MAP_TYPES.NONE;
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
          <WMSTile
            urlTemplate="https://julkinen.vayla.fi/inspirepalvelu/wms?service=WMS&version=1.1.1&request=GetMap&layers=avoin:TL137&format=image/png&transparent=true&styles=&bbox={minX},{minY},{maxX},{maxY}&width={width}&height={height}&srs=EPSG:3857"
            zIndex={2}
            tileSize={256}
            // Test steps:
            // 1) Without new tile provider properties: comment out tileCachePath & maximumNativeZ
            // 2) With maximumNativeZ only to test scaling past maxNativeZoom level
            // 3) With tileCachePath too - test caching performance with cutting & throttling network connectivity
            // 4) With tileCacheMaxAge too
            // 5) With offlineMode=true too - zoom in to test scaling of lower zoom level tiles to higher zoom levels
            //
            maximumNativeZ={12}
            // For testing activate different tile cache paths, examples below
            // work for simulator / emulator testing
            // This is for iOS simulator, both as fileURL and directory paths to be tested separately
            tileCachePath="file:///Users/suomimar/Library/Developer/CoreSimulator/wms_tiles"
            //tileCachePath="/Users/suomimar/Library/Developer/CoreSimulator/wms_tiles"
            // This is for Android simulator, both as fileURL and directory paths to be tested separately
            //tileCachePath="file:///data/user/0/com.airbnb.android.react.maps.example/files/wms_tiles"
            //tileCachePath="/data/user/0/com.airbnb.android.react.maps.example/files/wms_tiles"
            tileCacheMaxAge={20}
            opacity={1.0}
            //offlineMode={true}
          />
        </MapView>
        <View style={styles.buttonContainer}>
          <View style={styles.bubble}>
            <Text>Cached WMSTiles</Text>
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

export default CustomTiles;
