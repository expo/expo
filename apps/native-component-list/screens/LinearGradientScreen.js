import { LinearGradient } from 'expo';
import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import MonoText from '../components/MonoText';

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
          alignItems: 'stretch',
          paddingVertical: 10,
        }}>
        <ColorsTest colors={[this.state.colorTop, this.state.colorBottom]} />
        <LocationsTest locations={[location, 1.0 - location]} />
        <ControlPointTest start={[position, 0]} />
        {Platform.OS !== 'web' && <SnapshotTest />}
      </ScrollView>
    );
  }
}

class Container extends React.Component {
  render() {
    const { title, children } = this.props;

    return (
      <View style={styles.container}>
        <Text style={styles.containerTitle}>{title}</Text>
        {children}
      </View>
    );
  }
}

class SnapshotTest extends React.Component {
  render() {
    return (
      <Container title="Snapshot">
        <View
          style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-evenly' }}>
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
      </Container>
    );
  }
}

class ControlPointTest extends React.Component {
  render() {
    const { start = [0.5, 0], end = [0, 1] } = this.props;
    const startInfo = `start={[${start.map(point => +point.toFixed(2)).join(', ')}]}`;
    const endInfo = `end={[${end.map(point => +point.toFixed(2)).join(', ')}]}`;

    return (
      <Container title="Control Points">
        <View>
          {[startInfo, endInfo].map((pointInfo, index) => (
            <MonoText style={{}} key={'--' + index}>
              {pointInfo}
            </MonoText>
          ))}
        </View>
        <LinearGradient
          start={start}
          end={end}
          locations={[0.5, 0.5]}
          colors={['blue', 'lime']}
          style={{ flex: 1, height: 200 }}
        />
      </Container>
    );
  }
}

class ColorsTest extends React.Component {
  render() {
    const { colors } = this.props;
    const info = colors.map(value => `"${value}"`).join(', ');
    return (
      <Container title="Colors">
        <MonoText style={{}}>{`colors={[${info}]}`}</MonoText>
        <LinearGradient colors={colors} style={{ flex: 1, height: 200 }} />
      </Container>
    );
  }
}

class LocationsTest extends React.Component {
  render() {
    const { locations } = this.props;
    const locationsInfo = locations.map(location => +location.toFixed(2)).join(', ');
    return (
      <Container title="Locations">
        <MonoText style={{}}>{`locations={[${locationsInfo}]}`}</MonoText>
        <LinearGradient
          colors={['red', 'blue']}
          locations={locations}
          style={{ flex: 1, height: 200 }}
        />
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  containerTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
});
