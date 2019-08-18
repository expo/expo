import { Accelerometer } from 'expo-sensors';
import React from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants';

const COUNT = 5;
const ITEM_SIZE = Dimensions.get('window').width / COUNT;

interface State {
  items: any[];
  error: string | null;
  isSetup: boolean;
}

interface Props {
  numItems: number;
  perspective: number;
}

export default class AccelerometerScreen extends React.Component<Props, State> {
  static navigationOptions = {
    title: 'Accelerometer',
  };

  static defaultProps: Props = {
    perspective: 200,
    numItems: COUNT,
  };

  readonly state: State;

  constructor(props: Props) {
    super(props);

    const items = [];
    for (let i = 0; i < this.props.numItems; i++) {
      items.push({ position: new Animated.ValueXY() });
    }
    this.state = { items, error: null, isSetup: false };
  }

  componentWillUnmount() {
    Accelerometer.removeAllListeners();
  }

  async componentDidMount() {
    if (!(await Accelerometer.isAvailableAsync())) {
      this.setState({
        error:
          'Cannot start demo!' +
          '\nEnable device orientation in Settings > Safari > Motion & Orientation Access' +
          '\nalso ensure that you are hosting with https as DeviceMotion is now a secure API on iOS Safari.',
        isSetup: false,
      });
      return;
    }

    Accelerometer.addListener(({ x, y }) => {
      this.state.items.forEach((_, index) => {
        // All that matters is that the values are the same on iOS, Android, Web, ect...

        const { perspective } = this.props;
        const nIndex = index + 1;

        Animated.spring(this.state.items[index].position, {
          toValue: {
            x: (Number(x.toFixed(1)) * perspective * nIndex) / COUNT,
            y: (-y.toFixed(1) * perspective * nIndex) / COUNT,
          },
          friction: 7,
        }).start();
      });
    });

    this.setState({ isSetup: true });
  }

  render() {
    const { error, items, isSetup } = this.state;

    if (error) {
      return (
        <Container>
          <Text style={[styles.text, { color: 'red' }]}>{error}</Text>
        </Container>
      );
    }

    if (!isSetup) {
      return (
        <Container>
          <ActivityIndicator size="large" color={Colors.tintColor} />
          <Text
            style={[
              styles.text,
              {
                marginTop: 16,
              },
            ]}>
            Checking Permissions
          </Text>
        </Container>
      );
    }

    return (
      <Container>
        <Text style={[styles.text, styles.message]}>
          {`The stack should move against the orientation of the device.
          If you lift the bottom of the phone up, the stack should translate down towards the bottom of the screen.
          The balls all line up when the phone is in "display up" mode.`}
        </Text>
        {items.map((val, index) => {
          return (
            <Animated.View
              key={`item-${index}`}
              style={[
                styles.ball,
                {
                  opacity: (index + 1) / COUNT,
                  transform: [
                    { translateX: items[index].position.x },
                    { translateY: items[index].position.y },
                  ],
                },
              ]}
            />
          );
        })}
      </Container>
    );
  }
}

const Container = (props: any) => <View {...props} style={styles.container} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    zIndex: 1,
    fontWeight: '800',
    color: Colors.tintColor,
    textAlign: 'center',
  },
  message: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
  },
  ball: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE,
    backgroundColor: 'red',
  },
});
