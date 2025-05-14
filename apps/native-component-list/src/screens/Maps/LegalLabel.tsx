import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

import MapView, {Marker} from 'react-native-maps';

const screen = Dimensions.get('window');

class LegalLabel extends React.Component<any, any> {
  state = {
    _legalLabelPositionY: new Animated.Value(10),
    legalLabelPositionY: 10,
  };

  componentDidMount() {
    this.state._legalLabelPositionY.addListener(({value}) => {
      this.setState({
        legalLabelPositionY: value,
      });
    });
  }

  componentWillUnmount() {
    this.state._legalLabelPositionY.removeAllListeners();
  }

  onPressAnimate = () => {
    Animated.sequence([
      Animated.spring(this.state._legalLabelPositionY, {
        toValue: 100,
        useNativeDriver: true,
      }),
      Animated.spring(this.state._legalLabelPositionY, {
        toValue: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  render() {
    const latlng = {
      latitude: 37.78825,
      longitude: -122.4324,
    };

    const ASPECT_RATIO = screen.width / screen.height;
    const LATITUDE_DELTA = 0.0922;
    const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

    return (
      <View style={{...StyleSheet.absoluteFillObject}}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          legalLabelInsets={{
            top: 0,
            left: 0,
            bottom: this.state.legalLabelPositionY,
            right: 10,
          }}
          initialRegion={{
            ...latlng,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}>
          <Marker coordinate={latlng} />
        </MapView>

        <View style={styles.username}>
          <TouchableOpacity onPress={this.onPressAnimate}>
            <Text style={styles.usernameText}>Animate</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bio}>
          <Text style={styles.bioText}>
            Bio description lorem ipsum Ullamco exercitation aliqua ullamco
            nostrud dolor et aliquip fugiat do aute fugiat velit in aliqua sit.
          </Text>
        </View>

        <View style={styles.photo}>
          <View style={styles.photoInner}>
            <Text style={styles.photoText}>Profile Photo</Text>
          </View>
        </View>
      </View>
    );
  }
}

const padding = 10;
const photoSize = 80;
const mapHeight = screen.height - 130;
const styles = StyleSheet.create({
  bio: {
    marginHorizontal: padding,
    marginBottom: 0,
    paddingVertical: padding / 2,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 16 * 1.5,
  },
  username: {
    paddingLeft: photoSize + padding + padding,
    paddingTop: padding,
  },
  usernameText: {
    fontSize: 36,
    lineHeight: 36,
    color: 'blue',
    textDecorationLine: 'underline',
  },
  photo: {
    padding: 2,
    position: 'absolute',
    top: mapHeight - photoSize / 2,
    left: padding,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    width: photoSize,
    height: photoSize,
  },
  photoInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  photoText: {
    fontSize: 9,
    textAlign: 'center',
  },
  map: {
    height: mapHeight,
  },
});

export default LegalLabel;
