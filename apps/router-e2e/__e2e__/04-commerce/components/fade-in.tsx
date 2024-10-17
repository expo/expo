'use client';
import { Image, Animated, ScrollView, Text, View } from 'react-native';

import { useEffect, useMemo, useRef } from 'react';

export function FadeIn({ children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useMemo(() => {
    return Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
