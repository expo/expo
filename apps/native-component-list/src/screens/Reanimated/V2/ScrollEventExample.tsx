import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

function ScrollExample() {
  const transY = useSharedValue(0);
  const isScrolling = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      transY.value = event.contentOffset.y;
    },
    // eslint-disable-next-line handle-callback-err
    onBeginDrag: e => {
      isScrolling.value = true;
    },
    // eslint-disable-next-line handle-callback-err
    onEndDrag: e => {
      isScrolling.value = false;
    },
  });

  const stylez = useAnimatedStyle(() => {
    const size = isScrolling.value ? 80 : 40;
    return {
      transform: [
        {
          translateY: transY.value,
        },
      ],
      width: withSpring(size),
      height: withSpring(size),
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.half}>
        <Animated.View style={[styles.box, stylez]} />
      </View>
      <View style={styles.half}>
        <Animated.ScrollView style={styles.scroll} scrollEventThrottle={1} onScroll={scrollHandler}>
          <View style={styles.placeholder} />
          <View style={styles.placeholder} />
          <View style={styles.placeholder} />
          <View style={styles.placeholder} />
          <View style={styles.placeholder} />
        </Animated.ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  half: { flex: 1 },
  scroll: { flex: 1, backgroundColor: 'yellow' },
  box: {
    alignSelf: 'center',
    backgroundColor: 'black',
  },
  placeholder: {
    width: 40,
    height: 40,
    backgroundColor: 'brown',
    marginVertical: 300,
  },
});

export default ScrollExample;
