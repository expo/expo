import React, { useState } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  useLongPressGesture,
  useTapGesture,
} from 'react-native-gesture-handler';

export default function FancyButton({
  style,
  onLongPress,
  onSingleTap,
  onDoubleTap,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  onLongPress?: () => void;
  onSingleTap?: () => void;
  onDoubleTap?: () => void;
  children?: React.ReactNode;
}) {
  // Intentionally leave out double tap
  const [longPressed, setLongPressed] = useState(false);
  const [singleTapped, setSingleTapped] = useState(false);

  const longPress = useLongPressGesture({
    runOnJS: true,
    minDuration: 800,
    onBegin: () => setLongPressed(true),
    onActivate: () => onLongPress?.(),
    onFinalize: () => setLongPressed(false),
  });

  const doubleTap = useTapGesture({
    runOnJS: true,
    numberOfTaps: 2,
    onActivate: () => onDoubleTap?.(),
  });

  const singleTap = useTapGesture({
    runOnJS: true,
    onBegin: () => setSingleTapped(true),
    onActivate: () => onSingleTap?.(),
    onFinalize: () => setSingleTapped(false),
  });

  const gesture = useExclusiveGestures(longPress, doubleTap, singleTap);

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.button, style, { opacity: longPressed || singleTapped ? 0.5 : 1 }]}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    backgroundColor: '#cacaca',
    borderRadius: 5,
    alignItems: 'center',
  },
});
