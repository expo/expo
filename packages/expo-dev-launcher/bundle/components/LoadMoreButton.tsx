import { View, scale } from 'expo-dev-client-components';
import * as React from 'react';
import { Animated } from 'react-native';

import { ActivityIndicator } from './ActivityIndicator';
import { BasicButton } from './BasicButton';

type LoadMoreButtonProps = {
  isLoading: boolean;
  onPress: () => void;
};

export function LoadMoreButton({ isLoading, onPress }: LoadMoreButtonProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isLoading ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [isLoading]);

  const extraWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scale.xl],
  });

  const right = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-scale.xl * 1.5, -scale.tiny],
  });

  return (
    <View py="medium" align="centered">
      <BasicButton label="Load More" onPress={onPress}>
        <Animated.View style={{ width: extraWidth }} />

        <Animated.View style={{ position: 'absolute', right }}>
          <View width="large" height="large">
            <ActivityIndicator size="large" />
          </View>
        </Animated.View>
      </BasicButton>
    </View>
  );
}
