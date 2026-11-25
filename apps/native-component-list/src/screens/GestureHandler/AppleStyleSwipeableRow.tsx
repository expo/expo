import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

function LeftAction({ dragX, onPress }: { dragX: SharedValue<number>; onPress: () => void }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(dragX.value, [0, 50, 100, 101], [-20, 0, 0, 1]) }],
  }));
  return (
    <RectButton style={styles.leftAction} onPress={onPress}>
      <Animated.Text style={[styles.actionText, animatedStyle]}>Archive</Animated.Text>
    </RectButton>
  );
}

function RightAction({
  text,
  color,
  x,
  progress,
  onPress,
}: {
  text: string;
  color: string;
  x: number;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [x, 0]) }],
  }));
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <RectButton style={[styles.rightAction, { backgroundColor: color }]} onPress={onPress}>
        <Text style={styles.actionText}>{text}</Text>
      </RectButton>
    </Animated.View>
  );
}

export default function AppleStyleSwipeableRow({ children }: { children?: React.ReactNode }) {
  const swipeableRow = useRef<SwipeableMethods>(null);

  const close = () => {
    swipeableRow.current?.close();
  };
  const pressHandler = (text: string) => {
    close();
    alert(text);
  };

  const renderLeftActions = (_progress: SharedValue<number>, dragX: SharedValue<number>) => (
    <LeftAction dragX={dragX} onPress={close} />
  );
  const renderRightActions = (progress: SharedValue<number>) => (
    <View style={{ width: 192, flexDirection: 'row' }}>
      <RightAction
        text="More"
        color="#C8C7CD"
        x={192}
        progress={progress}
        onPress={() => pressHandler('More')}
      />
      <RightAction
        text="Flag"
        color="#ffab00"
        x={128}
        progress={progress}
        onPress={() => pressHandler('Flag')}
      />
      <RightAction
        text="More"
        color="#dd2c00"
        x={64}
        progress={progress}
        onPress={() => pressHandler('More')}
      />
    </View>
  );

  return (
    <Swipeable
      ref={swipeableRow}
      friction={2}
      leftThreshold={30}
      rightThreshold={40}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  leftAction: {
    flex: 1,
    backgroundColor: '#497AFC',
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'transparent',
    padding: 10,
  },
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
