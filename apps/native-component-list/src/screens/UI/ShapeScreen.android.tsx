import { Shape } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Page, Section } from '../../components/Page';
import { duration } from 'moment';
import Animated, {
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const AnimatedShape = Animated.createAnimatedComponent(Shape);

const pastelPalette = {
  color1: '#541388',
  color2: '#d1d646',
  color3: '#d90368',
  color4: '#2e294e',
  color5: '#ffd400',
};

export default function UIScreen() {
  const oneToZero = useSharedValue<number>(1);

  React.useEffect(() => {
    oneToZero.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.cubic }),
          withTiming(0, { duration: 1000, easing: Easing.cubic })
        ),
        -1,
        true
      )
    );
  }, []);

  const zeroToPointTwo = useSharedValue<number>(1);

  React.useEffect(() => {
    zeroToPointTwo.set(
      withRepeat(
        withSequence(
          withTiming(0, { duration: 1000, easing: Easing.cubic }),
          withTiming(0.2, { duration: 1000, easing: Easing.cubic })
        ),
        -1,
        true
      )
    );
  }, []);

  const oneToPointEight = useSharedValue<number>(1);

  React.useEffect(() => {
    oneToPointEight.set(
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.cubic }),
          withTiming(0.6, { duration: 1000, easing: Easing.cubic })
        ),
        -1,
        true
      )
    );
  }, []);

  return (
    <Page>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
        <AnimatedShape
          style={{ width: 180, height: 180 }}
          type={'POLYGON'}
          smoothing={1}
          cornerRounding={zeroToPointTwo}
          verticesCount={3}
          color={pastelPalette.color1}
        />
        <AnimatedShape
          style={{ width: 180, height: 180 }}
          type={'STAR'}
          innerRadius={oneToPointEight}
          smoothing={1}
          radius={1}
          cornerRounding={0.1}
          verticesCount={12}
          color={pastelPalette.color2}
        />
        <View style={{ width: 180, height: 180, justifyContent: 'center' }}>
          <AnimatedShape
            style={{ width: 180, height: 100 }}
            type={'PILL_STAR'}
            radius={1}
            innerRadius={0.7}
            smoothing={1}
            cornerRounding={0.05}
            verticesCount={12}
            color={pastelPalette.color3}
          />
        </View>

        <AnimatedShape
          style={{ width: 180, height: 180 }}
          type={'POLYGON'}
          cornerRounding={zeroToPointTwo}
          smoothing={1}
          verticesCount={6}
          color={pastelPalette.color4}
        />
        <View style={{ width: 180, height: 180, alignItems: 'center' }}>
          <AnimatedShape
            style={{ width: 100, height: 180, transform: [{ rotate: '45deg' }] }}
            type={'RECTANGLE'}
            radius={1}
            innerRadius={0.7}
            smoothing={1}
            cornerRounding={oneToZero}
            verticesCount={12}
            color={pastelPalette.color5}
          />
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 150,
    margin: 5,
    overflow: 'visible',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  columnWrapper: {
    justifyContent: 'space-around',
    alignContent: 'space-around',
  },
});
