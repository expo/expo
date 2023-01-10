import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Platform, Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import MonoText from '../components/MonoText';

// https://github.com/expo/expo/issues/10599
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function incrementColor(color: string, step: number) {
  const intColor = parseInt(color.substr(1), 16);
  const newIntColor = (intColor + step).toString(16);
  return `#${'0'.repeat(6 - newIntColor.length)}${newIntColor}`;
}

type State = {
  count: number;
  colorTop: string;
  colorBottom: string;
};

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class LinearGradientScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'LinearGradient',
  };

  state = {
    count: 0,
    colorTop: '#000000',
    colorBottom: '#cccccc',
  };

  _interval?: number;

  componentDidMount() {
    // @ts-expect-error: TS resolves node types first
    this._interval = setInterval(() => {
      this.setState((state) => ({
        count: state.count + 1,
        colorTop: incrementColor(state.colorTop, 1),
        colorBottom: incrementColor(state.colorBottom, -1),
      }));
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this._interval);
  }

  render() {
    const location = Math.sin(this.state.count / 100) * 0.5;
    const position = Math.abs(Math.sin(this.state.count / 100));
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          alignItems: 'stretch',
          paddingVertical: 10,
        }}>
        <AnimatedLinearGradient
          style={{ display: 'none' }}
          colors={[this.state.colorTop, this.state.colorBottom]}
        />
        <ColorsTest colors={[this.state.colorTop, this.state.colorBottom]} />
        <LocationsTest locations={[location, 1.0 - location]} />
        <ControlPointTest start={[position, 0]} />
        {Platform.OS !== 'web' && <SnapshotTest />}
      </ScrollView>
    );
  }
}

const Container: React.FunctionComponent<{ title: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.container}>
    <Text style={styles.containerTitle}>{title}</Text>
    {children}
  </View>
);

const SnapshotTest = () => (
  <Container title="Snapshot">
    <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-evenly' }}>
      <LinearGradient
        colors={['white', 'red']}
        start={[0.5, 0.5]}
        end={[1, 1]}
        style={{
          width: 100,
          maxHeight: 200,
          minHeight: 200,
          borderWidth: 1,
          marginVertical: 20,
          borderColor: 'black',
        }}
      />
      <Image
        source={require('../../assets/images/confusing_gradient.png')}
        style={{ width: 100, height: 200, marginVertical: 20 }}
      />
    </View>
    <Text style={{ marginHorizontal: 20 }}>The gradients above should look the same.</Text>
  </Container>
);

const ControlPointTest: React.FunctionComponent<{
  start?: [number, number];
  end?: [number, number];
}> = ({ start = [0.5, 0], end = [0, 1] }) => {
  const startInfo = `start={[${start.map((point) => +point.toFixed(2)).join(', ')}]}`;
  const endInfo = `end={[${end.map((point) => +point.toFixed(2)).join(', ')}]}`;

  return (
    <Container title="Control Points">
      <View>
        {[startInfo, endInfo].map((pointInfo, index) => (
          <MonoText key={'--' + index}>{pointInfo}</MonoText>
        ))}
      </View>
      <LinearGradient
        start={start}
        end={end}
        locations={[0.5, 0.5]}
        colors={['blue', 'lime']}
        style={styles.gradient}
      />
    </Container>
  );
};

const ColorsTest = ({ colors }: { colors: string[] }) => {
  const info = colors.map((value) => `"${value}"`).join(', ');
  return (
    <Container title="Colors">
      <MonoText>{`colors={[${info}]}`}</MonoText>
      <LinearGradient colors={colors} style={styles.gradient} />
    </Container>
  );
};

const LocationsTest: React.FunctionComponent<{ locations: number[] }> = ({ locations }) => {
  const locationsInfo = locations.map((location) => +location.toFixed(2)).join(', ');
  return (
    <Container title="Locations">
      <MonoText>{`locations={[${locationsInfo}]}`}</MonoText>
      <LinearGradient colors={['red', 'blue']} locations={locations} style={styles.gradient} />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    flexShrink: 0,
  },
  containerTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  gradient: {
    flex: 1,
    flexShrink: 0,
    minHeight: 200,
    maxHeight: 200,
  },
});
