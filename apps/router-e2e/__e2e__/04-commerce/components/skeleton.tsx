'use client';

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';

interface SkeletonProps {
  style?: ViewStyle;
  bgColor?: string;
  isLoading?: boolean;
  children?: ReactNode;
  delay?: number;
}

export const SkeletonBox = ({
  width,
  height,
  borderRadius = 8,
  delay,
}: {
  width: number;
  height: number;
  borderRadius?: number;
  delay?: number;
}) => {
  return (
    <Skeleton
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        minHeight: height,
        maxHeight: height,
        height,
        borderRadius,
      }}
      delay={delay}
    />
  );
};

const Skeleton = ({ style, bgColor = offWhite, delay }: SkeletonProps = {}) => {
  const translateX = useRef(new Animated.Value(-1)).current;
  const [width, setWidth] = useState(150);

  const targetRef = React.useRef<View>(null);

  const onLayout = React.useCallback((event) => {
    targetRef.current?.measureInWindow((x, y, width, height) => {
      setWidth(width);
    });
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          delay: delay || 0,
          toValue: 1,
          duration: 3000,
          useNativeDriver: process.env.EXPO_OS !== 'web',
          // Ease in
          easing: Easing.in(Easing.ease),
        }),
      ])
    ).start();
  }, [translateX]);

  const translateXStyle = React.useMemo(
    () => ({
      transform: [
        {
          translateX: translateX.interpolate({
            inputRange: [-1, 1],
            outputRange: [-width * 2, width * 1],
          }),
        },
      ],
    }),
    [translateX, width]
  );

  return (
    <View
      ref={targetRef}
      style={[
        {
          minHeight: 32,
          height: 32,
          borderRadius: 8,
        },
        style,
        { overflow: 'hidden', backgroundColor: bgColor },
      ]}
      onLayout={onLayout}>
      <Animated.View style={[translateXStyle, { width: '200%', height: '100%' }]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              experimental_backgroundImage: `linear-gradient(to right, ${bgColor}, rgb(205, 205, 205), rgb(205, 205, 205), ${bgColor}, rgb(205, 205, 205), ${bgColor})`,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const offWhite = '#f9f9f9';

export default Skeleton;
