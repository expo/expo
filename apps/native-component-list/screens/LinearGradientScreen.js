import { LinearGradient } from 'expo';
import React from 'react';
import { Text, ScrollView, View, Image } from 'react-native';

function incrementColor(color, step) {
  const intColor = parseInt(color.substr(1), 16);
  const newIntColor = (intColor + step).toString(16);
  return `#${'0'.repeat(6 - newIntColor.length)}${newIntColor}`;
}

export default class LinearGradientScreen extends React.Component {
  static navigationOptions = {
    title: 'LinearGradient',
  };

  state = {
    count: 0,
    colorTop: '#000000',
    colorBottom: '#cccccc',
  };

  componentDidMount() {
    this._interval = setInterval(() => {
      this.setState({
        count: this.state.count + 1,
        colorTop: incrementColor(this.state.colorTop, 1),
        colorBottom: incrementColor(this.state.colorBottom, -1),
      });
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this._interval);
  }

  render() {
    const location = Math.sin(this.state.count / 100) * 0.5;
    const position = Math.sin(this.state.count / 100);
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          alignItems: 'center',
          paddingVertical: 10,
        }}>
        <ColorsTest colors={[this.state.colorTop, this.state.colorBottom]} />
        <LocationsTest locations={[location, 1.0 - location]} />
        <ControlPointTest start={[position, 0]} />
        <SnapshotTest />
      </ScrollView>
    );
  }
}

const SnapshotTest = () => (
  <View>
    <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-evenly' }}>
      <LinearGradient
        colors={['white', 'red']}
        start={[0.5, 0.5]}
        end={[1, 1]}
        style={{
          width: 100,
          height: 200,
          borderWidth: 1,
          marginVertical: 20,
          borderColor: 'black',
        }}
      />
      <Image
        source={require('../assets/images/confusing_gradient.png')}
        style={{ width: 100, height: 200, marginVertical: 20 }}
      />
    </View>
    <Text style={{ marginHorizontal: 20 }}>The gradients above should look the same.</Text>
  </View>
);

const ControlPointTest = ({ start = [0.5, 0], end = [0, 1] }) => {
  const startInfo = `start={[${start.map(point => +point.toFixed(2)).join(', ')}]}`;
  const endInfo = `end={[${end.map(point => +point.toFixed(2)).join(', ')}]}`;

  return (
    <View>
      <LinearGradient
        start={start}
        end={end}
        locations={[0.5, 0.5]}
        colors={['blue', 'lime']}
        style={{ width: 200, height: 200 }}
      />
      {[startInfo, endInfo].map((pointInfo, index) => (
        <Text style={{}} key={'--' + index}>
          {pointInfo}
        </Text>
      ))}
    </View>
  );
};
const ColorsTest = ({ colors }) => {
  return (
    <View>
      <LinearGradient colors={colors} style={{ width: 200, height: 200 }} />
      {colors.map((color, index) => (
        <Text style={{ color }} key={'color-' + index}>
          {color}
        </Text>
      ))}
    </View>
  );
};

const LocationsTest = ({ locations }) => {
  const locationsInfo = locations.map(location => +location.toFixed(2)).join(', ');
  return (
    <View>
      <LinearGradient
        colors={['red', 'blue']}
        locations={locations}
        style={{ width: 200, height: 200 }}
      />
      <Text style={{}}>{`locations={[${locationsInfo}]}`}</Text>
    </View>
  );
};
