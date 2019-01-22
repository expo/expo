import { Accelerometer, Gyroscope } from 'expo-sensors';
import React from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';

const COUNT = 5;
const ITEM_SIZE = Dimensions.get('window').width / COUNT;

export default class AccelerometerScreen extends React.Component {
  static navigationOptions = {
    title: 'Accelerometer',
  };

  static defaultProps = {
    perspective: 200,
    numItems: COUNT,
  };

  state = {
    items: [],
  };

  componentWillUnmount() {
    Accelerometer.removeAllListeners();
  }

  componentWillMount() {
    const items = [];
    for (let i = 0; i < this.props.numItems; i++) {
      items.push({ position: new Animated.ValueXY() });
    }
    this.setState({ items });
  }

  componentDidMount() {
    Accelerometer.addListener(({ x, y }) => {
      this.state.items.forEach((box, index) => {
        // All that matters is that the values are the same on iOS, Android, Web, ect...

        const { perspective } = this.props;
        const nIndex = index + 1;

        Animated.spring(this.state.items[index].position, {
          toValue: {
            x: (x.toFixed(1) * perspective * nIndex) / COUNT,
            y: (-y.toFixed(1) * perspective * nIndex) / COUNT,
          },
          friction: 7,
        }).start();
      });
    });
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ position: 'absolute', top: 24, left: 24, right: 24, textAlign: 'center' }}>
          The stack should move in the against the direction of the device. If you lift the bottom
          of the phone up, the stack should translate down towards the bottom of the screen
        </Text>
        {this.state.items.map((val, index) => {
          return (
            <Animated.View
              key={`item-${index}`}
              style={{
                position: 'absolute',
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                borderRadius: ITEM_SIZE,
                backgroundColor: 'red',
                opacity: (index + 1) / COUNT,
                transform: [
                  { translateX: this.state.items[index].position.x },
                  { translateY: this.state.items[index].position.y },
                ],
              }}
            />
          );
        })}
      </View>
    );
  }
}
