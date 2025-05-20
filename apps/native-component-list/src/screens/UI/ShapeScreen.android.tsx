import { Shape } from '@expo/ui/jetpack-compose';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Page } from '../../components/Page';

const AnimatedPolygon = Animated.createAnimatedComponent(Shape.Polygon);
const AnimatedRectangle = Animated.createAnimatedComponent(Shape.Rectangle);
const AnimatedStar = Animated.createAnimatedComponent(Shape.Star);

const pastelPalette = {
  color1: '#541388',
  color2: '#d1d646',
  color3: '#d90368',
  color4: '#2e294e',
  color5: '#ffd400',
};

export default function UIScreen() {
  const oneToZero = useSharedValue<number | undefined>(1);

  useEffect(() => {
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

  const zeroToPointTwo = useSharedValue<number | undefined>(1);

  useEffect(() => {
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

  const oneToPointEight = useSharedValue<number | undefined>(1);

  useEffect(() => {
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
        <AnimatedPolygon
          style={{ width: 180, height: 180 }}
          smoothing={1}
          cornerRounding={zeroToPointTwo}
          verticesCount={3}
          color={pastelPalette.color1}
        />
        <AnimatedStar
          style={{ width: 180, height: 180 }}
          innerRadius={oneToPointEight}
          smoothing={1}
          radius={1}
          cornerRounding={0.1}
          verticesCount={12}
          color={pastelPalette.color2}
        />
        <View style={{ width: 180, height: 180, justifyContent: 'center' }}>
          <Shape.PillStar
            style={{ width: 180, height: 100 }}
            radius={1}
            innerRadius={0.7}
            smoothing={1}
            cornerRounding={0.05}
            verticesCount={12}
            color={pastelPalette.color3}
          />
        </View>

        <AnimatedPolygon
          style={{ width: 180, height: 180 }}
          cornerRounding={zeroToPointTwo}
          smoothing={1}
          verticesCount={6}
          color={pastelPalette.color4}
        />
        <View style={{ width: 180, height: 180, alignItems: 'center' }}>
          <AnimatedRectangle
            style={{ width: 100, height: 180, transform: [{ rotate: '45deg' }] }}
            smoothing={1}
            cornerRounding={oneToZero}
            color={pastelPalette.color5}
          />
        </View>
      </View>
    </Page>
  );
}
