import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { BaseButton } from 'react-native-gesture-handler';

import Colors from '../constants/Colors';

type Props = {
  onPress: () => void;
  children: any;
};

export default function BouncingShadowButton({ onPress, children }: Props) {
  const theme = useTheme();

  const scale = React.useMemo(() => new Animated.Value(1), []);

  const onStateChanged = React.useCallback((active) => {
    if (active) {
      Animated.spring(scale, { useNativeDriver: true, toValue: 0.95 }).start();
    } else {
      Animated.spring(scale, { useNativeDriver: true, toValue: 1 }).start();
    }
  }, []);

  return (
    <BaseButton onPress={onPress} onActiveStateChange={onStateChanged} style={styles.container}>
      <Animated.View
        style={[
          {
            backgroundColor: theme.dark ? Colors.dark.cardBackground : '#fff',
            transform: [{ scale }],
          },
          styles.view,
        ]}>
        {children}
      </Animated.View>
    </BaseButton>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15,
    marginTop: -5,
  },
  view: {
    padding: 15,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
});
