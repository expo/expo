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
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Colors } from '../constants';

const COUNT = 5;
const ITEM_SIZE = Dimensions.get('window').width / COUNT;
const PERSPECTIVE = 200;

interface Position {
  x: number;
  y: number;
}

interface BallProps {
  index: number;
  position: Position;
}

function useLockedScreenOrientation() {
  React.useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => null);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL).catch(() => null);
    };
  }, []);
}

export default function AccelerometerScreen() {
  useLockedScreenOrientation();

  const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 });
  const [error, setError] = React.useState<string | null>(null);
  const [isSetup, setSetup] = React.useState<boolean>(false);
  const [shouldUseReanimated, setShouldUseReanimated] = React.useState<boolean>(false);

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
      setPosition({ x, y });
    });
    return () => sub.remove();
  }, [isSetup]);

  const switchComponent = React.useCallback(() => {
    setShouldUseReanimated(!shouldUseReanimated);
  }, [shouldUseReanimated]);

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
      <Text style={styles.text}>
        {`The stack should move against the orientation of the device.
          If you lift the bottom of the phone up, the stack should translate down towards the bottom of the screen.
          The balls all line up when the phone is in "display up" mode.`}
      </Text>
      <Container>
        {Array(COUNT)
          .fill(null)
          .map((_, index) => {
            const props = { key: `ball-${index}`, index, position };
            if (shouldUseReanimated) {
              return <ReanimatedBall {...props} />;
            } else {
              return <AnimatedBall {...props} />;
            }
          })}
      </Container>
      <View style={styles.switchComponentButton}>
        <Button
          title={`Switch to ${shouldUseReanimated ? 'Animated' : 'Reanimated'}`}
          onPress={switchComponent}
        />
      </View>
    </Container>
  );
}

function AnimatedBall({ index, position }: BallProps) {
  const translate = React.useMemo(
    () =>
      new Animated.ValueXY({
        x: position.x,
        y: position.y,
      }),
    []
  );

  const animatedStyle = {
    opacity: (index + 1) / COUNT,
    transform: [{ translateX: translate.x }, { translateY: translate.y }],
  };

  React.useEffect(() => {
    Animated.spring(translate, {
      toValue: calculateTranslateValue(index, position),
      useNativeDriver: false,
      friction: 7,
    }).start();
  }, [index, position.x, position.y]);

  return <Animated.View style={[styles.ball, animatedStyle]} />;
}

function ReanimatedBall({ index, position }: BallProps) {
  const translate = useSharedValue({
    x: position.x,
    y: position.y,
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: (index + 1) / COUNT,
      transform: [{ translateX: translate.value.x }, { translateY: translate.value.y }],
    };
  }, [index]);

  React.useEffect(() => {
    translate.value = withSpring(calculateTranslateValue(index, position));
  }, [index, position.x, position.y]);

  return <Reanimated.View style={[styles.ball, animatedStyle]} />;
}

function calculateTranslateValue(index: number, position: any): any {
  return {
    x: (Number(position.x.toFixed(1)) * PERSPECTIVE * (index + 1)) / COUNT,
    y: (-position.y.toFixed(1) * PERSPECTIVE * (index + 1)) / COUNT,
  };
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
    padding: 24,
    zIndex: 1,
    fontWeight: '800',
    color: Colors.tintColor,
    textAlign: 'center',
  },
  ball: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE,
    backgroundColor: 'red',
  },
  switchComponentButton: {
    margin: 24,
  },
});
