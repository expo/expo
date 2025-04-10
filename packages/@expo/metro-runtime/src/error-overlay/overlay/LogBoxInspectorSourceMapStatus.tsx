/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';

import * as LogBoxStyle from '../LogBoxStyle';

import {
  GestureResponderEvent,
  type Insets,
  Platform,
  Pressable,
  View,
  ViewStyle,
} from 'react-native';

function LogBoxButton(props: {
  backgroundColor: {
    default: string;
    pressed: string;
  };
  children?: any;
  hitSlop?: Insets;
  onPress?: ((event: GestureResponderEvent) => void) | null;
  style?: ViewStyle;
}) {
  const [pressed, setPressed] = useState(false);

  let backgroundColor = props.backgroundColor;
  if (!backgroundColor) {
    backgroundColor = {
      default: LogBoxStyle.getBackgroundColor(0.95),
      pressed: LogBoxStyle.getBackgroundColor(0.6),
    };
  }

  const content = (
    <View
      style={[
        {
          backgroundColor: pressed ? backgroundColor.pressed : backgroundColor.default,
          ...Platform.select({
            web: {
              cursor: 'pointer',
            },
          }),
        },
        props.style,
      ]}>
      {props.children}
    </View>
  );

  return props.onPress == null ? (
    content
  ) : (
    <Pressable
      hitSlop={props.hitSlop}
      onPress={props.onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}>
      {content}
    </Pressable>
  );
}

export function LogBoxInspectorSourceMapStatus(props: {
  onPress?: ((event: GestureResponderEvent) => void) | null;
  status: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING';
}) {
  const [state, setState] = useState<{
    animation: null | Animated.CompositeAnimation;
    rotate: null | Animated.AnimatedInterpolation<string>;
  }>({
    animation: null,
    rotate: null,
  });

  useEffect(() => {
    if (props.status === 'PENDING') {
      if (state.animation == null) {
        const animated = new Animated.Value(0);
        const animation = Animated.loop(
          Animated.timing(animated, {
            duration: 2000,
            easing: Easing.linear,
            toValue: 1,
            useNativeDriver: true,
          }),
          {
            iterations: -1,
          }
        );
        setState({
          animation,
          rotate: animated.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        });
        animation.start();
      }
    } else {
      if (state.animation != null) {
        state.animation.stop();
        setState({
          animation: null,
          rotate: null,
        });
      }
    }

    return () => {
      if (state.animation != null) {
        state.animation.stop();
      }
    };
  }, [props.status, state.animation]);

  let image;
  let color;
  switch (props.status) {
    case 'FAILED':
      image = require('@expo/metro-runtime/assets/alert-triangle.png');
      color = `rgba(243, 83, 105, 1)`;
      break;
    case 'PENDING':
      image = require('@expo/metro-runtime/assets/loader.png');
      color = `rgba(250, 186, 48, 1)`;
      break;
  }

  if (props.status === 'COMPLETE' || image == null) {
    return null;
  }

  return (
    <LogBoxButton
      backgroundColor={{
        default: 'transparent',
        pressed: LogBoxStyle.getBackgroundColor(1),
      }}
      hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
      onPress={props.onPress}
      style={styles.root}>
      <Animated.Image
        source={image}
        tintColor={color ?? LogBoxStyle.getTextColor(0.4)}
        style={[
          styles.image,
          state.rotate == null || props.status !== 'PENDING'
            ? null
            : { transform: [{ rotate: state.rotate }] },
        ]}
      />
      <Text style={[styles.text, { color }]}>Source Map</Text>
    </LogBoxButton>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    height: 24,
    paddingHorizontal: 8,
  },
  image: {
    height: 14,
    width: 16,
    marginEnd: 4,
  },
  text: {
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
  },
});
