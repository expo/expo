import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { BottomSheetProvider } from '../../hooks/useBottomSheet';
import {
  hideMenu,
  subscribeToCloseEvents,
  subscribeToOpenEvents,
} from '../../native-modules/DevMenu';
import { BottomSheet } from './BottomSheet';

const { onChange, cond, eq, call, Value } = Animated;

type BottomSheetContainerProps = {
  children: React.ReactNode;
};

export function BottomSheetContainer({ children }: BottomSheetContainerProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  const snapPoints = React.useMemo(() => [0, '60%', '90%'], []);

  React.useEffect(() => {
    bottomSheetRef.current?.snapTo(1);

    const listener = subscribeToOpenEvents(() => {
      bottomSheetRef.current?.snapTo(1);
    });

    return () => listener.remove();
  }, []);

  React.useEffect(() => {
    const listener = subscribeToCloseEvents(() => {
      bottomSheetRef.current?.snapTo(0);
    });

    return () => listener.remove();
  }, []);

  const callbackNode = React.useRef(new Value(0));

  const trackCallbackNode = React.useRef(
    onChange(callbackNode.current, cond(eq(callbackNode.current, 0), call([], hideMenu)))
  );

  const backgroundOpacity = callbackNode.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <BottomSheetProvider collapse={() => bottomSheetRef.current.snapTo(0)}>
      <View style={styles.container}>
        <Pressable
          onPress={() => bottomSheetRef.current.snapTo(0)}
          style={styles.bottomSheetBackground}>
          <Animated.View
            style={[
              styles.bottomSheetBackground,
              { opacity: backgroundOpacity, backgroundColor: '#000' },
            ]}
          />
        </Pressable>
        <BottomSheet
          ref={bottomSheetRef}
          callbackNode={callbackNode.current}
          snapPoints={snapPoints}>
          {children}
          <Animated.Code exec={trackCallbackNode.current} />
        </BottomSheet>
      </View>
    </BottomSheetProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSheetBackground: {
    ...StyleSheet.absoluteFillObject,
  },
});
