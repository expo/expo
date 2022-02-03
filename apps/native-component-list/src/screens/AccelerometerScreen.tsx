import * as ScreenOrientation from 'expo-screen-orientation';
import { Accelerometer } from 'expo-sensors';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '../constants';

const COUNT = 5;
const ITEM_SIZE = Dimensions.get('window').width / COUNT;

interface Props {
  numItems: number;
  perspective: number;
}

function useLockedScreenOrientation() {
  React.useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => null);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL).catch(() => null);
    };
  }, []);
}

export default function AccelerometerScreen({ numItems = COUNT, perspective = 200 }: Props) {
  useLockedScreenOrientation();

  const [items, setItems] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isSetup, setSetup] = React.useState<boolean>(false);

  React.useEffect(() => {
    const items = [];
    for (let i = 0; i < numItems; i++) {
      items.push({ position: new Animated.ValueXY() });
    }
    setItems(items);
  }, [numItems]);

  React.useEffect(() => {
    (async () => {
      const { status } = await Accelerometer.getPermissionsAsync();
      if (status === 'denied') {
        setError(`Cannot start demo!\nMotion permission is ${status}.`);
      } else if (status === 'undetermined') {
        return;
      }
      if (!(await Accelerometer.isAvailableAsync())) {
        setError('Accelerometer is not available on this device!');
        return;
      }

      setSetup(true);
    })();
  }, []);

  React.useEffect(() => {
    if (!isSetup) return;

    const sub = Accelerometer.addListener(({ x, y }) => {
      // console.log('event');
      items.forEach((_, index) => {
        // All that matters is that the values are the same on iOS, Android, Web, ect...
        const nIndex = index + 1;

        Animated.spring(items[index].position, {
          toValue: {
            x: (Number(x.toFixed(1)) * perspective * nIndex) / COUNT,
            y: (-y.toFixed(1) * perspective * nIndex) / COUNT,
          },
          useNativeDriver: false,
          friction: 7,
        }).start();
      });
    });
    return () => sub.remove();
  }, [isSetup]);

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

        <Button
          title="Ask Permission"
          onPress={async () => {
            const { status } = await Accelerometer.requestPermissionsAsync();
            if (status !== 'granted') {
              setError(`Cannot start demo!\nMotion permission is ${status}.`);
            }
            if (!(await Accelerometer.isAvailableAsync())) {
              setError('Accelerometer is not available on this device!');
              return;
            }

            setSetup(true);
          }}
        />
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

AccelerometerScreen.navigationOptions = {
  title: 'Accelerometer',
};

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
