import React from 'react';
import {StyleSheet, View, Text, Dimensions, ScrollView} from 'react-native';
import MapView, {Marker} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

class ThemeMap extends React.Component<any, any> {
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
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollview}>
          <Text>MAPKIT ONLY{'\n'}</Text>
          <Text>System</Text>
          <MapView
            provider={this.props.provider}
            style={styles.map}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            initialRegion={this.state.region}>
            <Marker
              title="This is a title"
              description="This is a description"
              coordinate={this.state.region}
            />
          </MapView>

          <Text>{'\n'}Light</Text>
          <MapView
            provider={this.props.provider}
            style={styles.map}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            initialRegion={this.state.region}
            userInterfaceStyle="light">
            <Marker
              title="This is a title"
              description="This is a description"
              coordinate={this.state.region}
            />
          </MapView>
          <Text>{'\n'}Dark</Text>
          <MapView
            provider={this.props.provider}
            style={styles.map}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            initialRegion={this.state.region}
            userInterfaceStyle="dark">
            <Marker
              title="This is a title"
              description="This is a description"
              coordinate={this.state.region}
            />
          </MapView>
        </ScrollView>
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
  scrollview: {
    alignItems: 'center',
    paddingVertical: 70,
  },
  map: {
    width: 200,
    height: 200,
  },
});

export default ThemeMap;
