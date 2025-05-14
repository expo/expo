import React from 'react';
import {View} from 'react-native';
import {Polygon, Polyline, Marker} from 'react-native-maps';

class XMarksTheSpot extends React.Component<any, any> {
  render() {
    return (
      <View>
        <Polygon
          coordinates={this.props.coordinates}
          strokeColor="rgba(0, 0, 0, 1)"
          strokeWidth={3}
        />
        <Polyline
          coordinates={[this.props.coordinates[0], this.props.coordinates[2]]}
        />
        <Polyline
          coordinates={[this.props.coordinates[1], this.props.coordinates[3]]}
        />
        <Marker coordinate={this.props.center} />
      </View>
    );
  }
}

export default XMarksTheSpot;
