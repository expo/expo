/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from 'react';
import { Animated, Easing, GestureResponderEvent, StyleSheet, Text } from 'react-native';

import { LogBoxButton } from '../UI/LogBoxButton';
import * as LogBoxStyle from '../UI/LogBoxStyle';

type Props = {
  onPress?: ((event: GestureResponderEvent) => void) | null;
  status: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING';
};

export function LogBoxInspectorSourceMapStatus(props: Props) {
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
          })
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
      color = LogBoxStyle.getErrorColor(1);
      break;
    case 'PENDING':
      image = require('@expo/metro-runtime/assets/loader.png');
      color = LogBoxStyle.getWarningColor(1);
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
