import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

const AnimatedIcon = Animated.createAnimatedComponent(MaterialIcons);

function ActionIcon({
  name,
  style,
  dragX,
  inputRange,
  outputRange,
  onPress,
}: {
  name: 'archive' | 'delete-forever';
  style: typeof styles.leftAction;
  dragX: SharedValue<number>;
  inputRange: number[];
  outputRange: number[];
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(dragX.value, inputRange, outputRange, Extrapolation.CLAMP) }],
  }));
  return (
    <RectButton style={style} onPress={onPress}>
      <AnimatedIcon name={name} size={30} color="#fff" style={[styles.actionIcon, animatedStyle]} />
    </RectButton>
  );
}

export default function GmailStyleSwipeableRow({ children }: { children?: React.ReactNode }) {
  const swipeableRow = useRef<SwipeableMethods>(null);

  const close = () => {
    swipeableRow.current?.close();
  };

  const renderLeftActions = (_progress: SharedValue<number>, dragX: SharedValue<number>) => (
    <ActionIcon
      name="archive"
      style={styles.leftAction}
      dragX={dragX}
      inputRange={[0, 80]}
      outputRange={[0, 1]}
      onPress={close}
    />
  );
  const renderRightActions = (_progress: SharedValue<number>, dragX: SharedValue<number>) => (
    <ActionIcon
      name="delete-forever"
      style={styles.rightAction}
      dragX={dragX}
      inputRange={[-80, 0]}
      outputRange={[1, 0]}
      onPress={close}
    />
  );

  return (
    <Swipeable
      ref={swipeableRow}
      friction={2}
      leftThreshold={80}
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
    backgroundColor: '#388e3c',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 30,
    marginHorizontal: 10,
  },
  rightAction: {
    alignItems: 'flex-end',
    backgroundColor: '#dd2c00',
    flex: 1,
    justifyContent: 'center',
  },
});
