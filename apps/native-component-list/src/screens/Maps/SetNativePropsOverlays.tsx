import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import MapView, {Circle, Polygon, Polyline} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const SPACE = 0.01;

class SetNativePropsOverlays extends React.Component<any, any> {
  circle: any;
  polygon: any;
  polyline: any;
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      circle: {
        center: {
          latitude: LATITUDE + SPACE,
          longitude: LONGITUDE + SPACE,
        },
        radius: 700,
      },
      polygon: [
        {
          latitude: LATITUDE + SPACE,
          longitude: LONGITUDE + SPACE,
        },
        {
          latitude: LATITUDE - SPACE,
          longitude: LONGITUDE - SPACE,
        },
        {
          latitude: LATITUDE - SPACE,
          longitude: LONGITUDE + SPACE,
        },
      ],
      polyline: [
        {
          latitude: LATITUDE + SPACE,
          longitude: LONGITUDE - SPACE,
        },
        {
          latitude: LATITUDE - 2 * SPACE,
          longitude: LONGITUDE + 2 * SPACE,
        },
        {
          latitude: LATITUDE - SPACE,
          longitude: LONGITUDE - SPACE,
        },
        {
          latitude: LATITUDE - 2 * SPACE,
          longitude: LONGITUDE - SPACE,
        },
      ],
    };
  }

  handleColorChange(color: any) {
    const props = {strokeColor: color};
    this.circle.setNativeProps(props);
    this.polygon.setNativeProps(props);
    this.polyline.setNativeProps(props);
  }

  render() {
    const {region, circle, polygon, polyline} = this.state;
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          initialRegion={region}>
          <Circle
            ref={ref => {
              this.circle = ref;
            }}
            center={circle.center}
            radius={circle.radius}
            fillColor="rgba(255, 255, 255, 0.6)"
            strokeColor="green"
            zIndex={3}
            strokeWidth={3}
          />
          <Polygon
            ref={ref => {
              this.polygon = ref;
            }}
            coordinates={polygon}
            fillColor="rgba(255, 255, 255, 0.6)"
            strokeColor="green"
            strokeWidth={2}
          />
          <Polyline
            ref={ref => {
              this.polyline = ref;
            }}
            coordinates={polyline}
            strokeColor="green"
            strokeWidth={3}
          />
        </MapView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => {
              this.handleColorChange('green');
            }}>
            <View style={styles.bubble}>
              <Text>Green</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              this.handleColorChange('black');
            }}>
            <View style={styles.bubble}>
              <Text>Black</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              this.handleColorChange('red');
            }}>
            <View style={styles.bubble}>
              <Text>Red</Text>
            </View>
          </TouchableOpacity>
        </View>
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
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});

export default SetNativePropsOverlays;
