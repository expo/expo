import { Code } from '@expo/html-elements';
import React, { PropsWithChildren, useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';

import Colors from '../constants/Colors';

type Props = PropsWithChildren<{
  /**
   * Countdown timeout.
   */
  timeout?: number;

  /**
   * Called when the countdown ended or close button is pressed.
   */
  onCountdownEnded: () => void;

  style?: StyleProp<ViewStyle>;
}>;

function MonoTextWithCountdown({ style, children, timeout = 8000, onCountdownEnded }: Props) {
  const animatedValue = useRef(new Animated.Value(1)).current;
  const [countdownInterrupted, setCountdownInterrupted] = useState(false);
  const [valueUponPause, setValueUponPause] = useState(1);

  useEffect(() => {
    if (countdownInterrupted) {
      animatedValue.stopAnimation((value) => {
        setValueUponPause(value);
      });
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: valueUponPause * timeout,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          onCountdownEnded();
        }
      });
    }
  }, [countdownInterrupted, valueUponPause, onCountdownEnded]);

  const triggerCountdownEnd = useCallback(() => {
    onCountdownEnded();
  }, [onCountdownEnded]);
  const toggleCountdown = useCallback(() => {
    setCountdownInterrupted((previousValue) => !previousValue);
  }, [countdownInterrupted]);

  return (
    <View style={[styles.container, style]}>
      <Code style={styles.monoText}>{children}</Code>
      <View style={styles.buttonsContainer}>
        <IconButton icon={countdownInterrupted ? '▶️' : '⏸'} onPress={toggleCountdown} />
        <IconButton icon="❌" onPress={triggerCountdownEnd} />
      </View>
      <CountdownBar width={animatedValue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: '#00AA00',
    backgroundColor: '#fff',
  },

  monoText: {
    fontSize: 10,
    padding: 6,
  },

  countdownBar: {
    height: 3,
    backgroundColor: Colors.tintColor,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  buttonsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
  },
  buttonIcon: {
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
});

type IconButtonProps = {
  icon: string;
  onPress: () => void;
};

function IconButton({ icon, onPress }: IconButtonProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.buttonIcon}>{icon}</Text>
    </TouchableOpacity>
  );
}

type CountdownBarProps = {
  width: Animated.Value;
};

function CountdownBar({ width }: CountdownBarProps) {
  return (
    <Animated.View
      style={[
        styles.countdownBar,
        {
          width: width.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        },
      ]}
    />
  );
}

export default MonoTextWithCountdown;
