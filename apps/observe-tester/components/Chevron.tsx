import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { useTheme } from '@/utils/theme';

type ChevronProps = {
  expanded: boolean;
  size?: number;
  color?: string;
  animated?: boolean;
  style?: StyleProp<TextStyle>;
};

export function Chevron({ expanded, size = 18, color, animated = true, style }: ChevronProps) {
  const theme = useTheme();
  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    if (!animated) {
      rotation.setValue(expanded ? 1 : 0);
      return;
    }
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [expanded, animated, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.chevron,
        { fontSize: size, color: color ?? theme.text.tertiary, transform: [{ rotate }] },
        style,
      ]}>
      ❯
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  chevron: {
    fontWeight: '600',
  },
});
