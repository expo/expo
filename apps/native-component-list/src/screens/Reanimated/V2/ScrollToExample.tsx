import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  // @ts-ignore
  scrollTo,
  useDerivedValue,
  // @ts-ignore
  useAnimatedRef,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const indices = [0, 1, 2, 3];

const range = [0, 9999];

const dotSize = 40;

export default function ScrollToScreen() {
  const progress = useSharedValue(0);
  const number = useDerivedValue(() => {
    const val = range[0] + Math.round(progress.value * (range[1] - range[0]));
    return val;
  });

  return (
    <SafeAreaView>
      <View style={{ alignItems: 'center' }}>
        <NumberDisplay number={number} />
        <Text>move dot</Text>
        <View>
          <ProgressBar progress={progress} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function getDigit(number: Animated.SharedValue<number>, i: number) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useDerivedValue(() => {
    return Math.floor(number.value / 10 ** i) % 10;
  });
}

function NumberDisplay({ number }: { number: Animated.SharedValue<number> }) {
  return (
    <View style={{ height: 400, width: 200 }}>
      <View
        style={{
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        {indices.map(i => {
          return <Digit digit={getDigit(number, i)} key={i} />;
        })}
      </View>
    </View>
  );
}

function Digit({ digit }: { digit: Animated.SharedValue<number> }) {
  const aref = useAnimatedRef();

  // @ts-ignore
  useDerivedValue(() => {
    scrollTo(aref, 0, digit.value * 200, true);
  });

  return (
    <View style={{ height: 200 }}>
      <ScrollView ref={aref}>
        {digits.map(i => {
          return (
            <View
              style={{
                height: 200,
                alignItems: 'center',
                flexDirection: 'row',
              }}
              key={i}>
              <Text style={{ fontSize: 30 }}>{i}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ProgressBar({ progress }: { progress: Animated.SharedValue<number> }) {
  const x = useSharedValue(0);
  const max = useSharedValue(0);

  const handler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.x = x.value;
    },
    onActive: (e, ctx) => {
      let newVal = ctx.x + e.translationX;
      newVal = Math.min(max.value, newVal);
      newVal = Math.max(0, newVal);
      x.value = newVal;
    },
    onEnd: _ => {
      progress.value = x.value / max.value;
    },
  });

  const stylez = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: x.value }],
    };
  });

  const barStyle = useAnimatedStyle(() => {
    return {
      width: max.value,
    };
  });
  return (
    <View style={{ height: 100, paddingRight: 80, paddingLeft: 40, width: 300 }}>
      <View
        onLayout={e => {
          max.value = e.nativeEvent.layout.width;
        }}>
        <Animated.View
          style={[
            {
              backgroundColor: 'black',
              height: 2,
              marginRight: 20,
              transform: [{ translateY: dotSize / 2 + 1 }, { translateX: dotSize / 2 }],
            },
            barStyle,
          ]}
        />
        <PanGestureHandler onGestureEvent={handler}>
          <Animated.View style={[styles.dot, stylez]} />
        </PanGestureHandler>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 100,
    backgroundColor: 'black',
    width: dotSize,
    height: dotSize,
  },
});
