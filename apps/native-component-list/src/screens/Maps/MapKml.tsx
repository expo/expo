import React from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import MapView, {Marker} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = -18.9193508;
const LONGITUDE = -48.2830592;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const KML_FILE = 'https://pastebin.com/raw/jAzGpq1F';

export default class MapKml extends React.Component<any, any> {
  map: any;
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
    };

    this.onKmlReady = this.onKmlReady.bind(this);
  }

  onKmlReady() {
    this.map.fitToElements({animated: true});
  }

  render() {
    return (
      <View style={styles.container}>
        <MapView
          ref={ref => {
            this.map = ref;
          }}
          provider={this.props.provider}
          style={styles.map}
          initialRegion={this.state.region}
          kmlSrc={KML_FILE}
          onKmlReady={this.onKmlReady}>
          <Marker
            coordinate={this.state.region}
            title="Test"
            description="Test"
          />
        </MapView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scrollview: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  map: {
    width,
    height,
  },
});
