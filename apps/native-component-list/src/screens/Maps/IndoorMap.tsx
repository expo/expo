import React from 'react';
import {StyleSheet, View, Dimensions, Button, Alert} from 'react-native';
import MapView from 'react-native-maps';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE = 1.3039991;
const LONGITUDE = 103.8316911;
const LATITUDE_DELTA = 0.003;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default class IndoorMap extends React.Component<any, any> {
  map: any;
  constructor(props: any) {
    super(props);
    this.setIndoorLevel = this.setIndoorLevel.bind(this);
  }

  handleIndoorFocus(event: any) {
    const {indoorBuilding} = event.nativeEvent;
    const {defaultLevelIndex, levels} = indoorBuilding;
    const levelNames = levels.map((lv: any) => lv.name || '');
    const msg = `Default Level: ${defaultLevelIndex}\nLevels: ${levelNames.toString()}`;
    Alert.alert('Indoor building focused', msg);
  }

  setIndoorLevel(level: any) {
    this.map.setIndoorActiveLevelIndex(level);
  }

  render() {
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          initialRegion={{
            latitude: LATITUDE,
            longitude: LONGITUDE,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          showsIndoors
          showsIndoorLevelPicker
          onIndoorBuildingFocused={this.handleIndoorFocus}
          ref={map => {
            this.map = map;
          }}
        />
        <Button
          title="go to level 5"
          onPress={() => {
            this.setIndoorLevel(5);
          }}
        />
        <Button
          title="go to level 1"
          onPress={() => {
            this.setIndoorLevel(1);
          }}
        />
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
