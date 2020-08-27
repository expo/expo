import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  cancelAnimation,
  interpolate,
  Extrapolate,
  withSpring,
} from 'react-native-reanimated';

import Button from './Button';
import Content from './Content';
import Weave from './Weave';
import { initialSideWidth, initialWaveCenter } from './WeaveHelpers';

export const assets = [
  require('./assets/firstPageImage.png'),
  require('./assets/secondPageImage.png'),
];

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default () => {
  const isBack = useSharedValue(0);
  const centerY = useSharedValue(initialWaveCenter);
  const progress = useSharedValue(0);

  const maxDist = width - initialSideWidth;

  const handler = useAnimatedGestureHandler({
    onStart: (event, ctx) => {
      // stop animating progress, this will also place "isBack" value in the
      // final state (we update isBack in progress animation callback)
      cancelAnimation(progress);
      ctx.dragX = 0;
      ctx.startY = isBack.value ? event.y : centerY.value;
    },
    onActive: (event, ctx) => {
      centerY.value = ctx.startY + event.translationY;
      if (isBack.value) {
        progress.value = interpolate(event.translationX, [0, maxDist], [1, 0], Extrapolate.CLAMP);
      } else {
        progress.value = interpolate(
          event.translationX,
          [-maxDist, 0],
          [0.4, 0],
          Extrapolate.CLAMP
        );
      }
    },
    onEnd: () => {
      let goBack;
      if (isBack.value) {
        goBack = progress.value > 0.5 ? 1 : 0;
      } else {
        // TODO: want to use a boolean here
        goBack = progress.value > 0.2 ? 1 : 0;
      }
      centerY.value = withSpring(initialWaveCenter);
      progress.value = withSpring(goBack ? 1 : 0, {}, () => {
        isBack.value = goBack;
      });
    },
  });

  return (
    <View style={styles.container}>
      <Content
        backgroundColor="white"
        source={assets[0]}
        title1="Online"
        title2="Gambling"
        color="black"
      />
      <PanGestureHandler onGestureEvent={handler} onHandlerStateChange={handler}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Weave progress={progress} centerY={centerY} isBack={isBack}>
            <Content
              backgroundColor="#4d1168"
              source={assets[1]}
              title1="For"
              title2="Gamers"
              color="#fd5587"
            />
          </Weave>
          <Button y={centerY} progress={progress} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};
