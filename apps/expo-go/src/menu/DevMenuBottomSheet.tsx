import BottomSheet, {
  BottomSheetScrollView,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import DevMenuBottomSheetContext from './DevMenuBottomSheetContext';
import * as DevMenu from './DevMenuModule';

type Props = {
  uuid: string;
  children?: React.ReactNode;
};

function Backdrop({ onPress }: { onPress: () => void }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(0.5, { duration: 350 });
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View style={[styles.backdrop, animatedStyle]} />
    </TouchableWithoutFeedback>
  );
}

function DevMenuBottomSheet({ children, uuid }: Props) {
  const bottomSheetRef = useRef<BottomSheet | null>(null);

  const onCollapse = useCallback(
    () =>
      new Promise<void>((resolve) => {
        bottomSheetRef.current?.close();

        setTimeout(() => {
          resolve();
          DevMenu.closeAsync();
        }, 300);
      }),
    []
  );

  const onExpand = useCallback(
    () =>
      new Promise<void>((resolve) => {
        bottomSheetRef.current?.expand();
        setTimeout(() => {
          resolve();
        }, 300);
      }),
    []
  );

  const onChange = useCallback((index: number) => {
    if (index === -1) {
      DevMenu.closeAsync();
    }
  }, []);

  useEffect(() => {
    const closeSubscription = DevMenu.listenForCloseRequests(() => {
      bottomSheetRef.current?.collapse();
      return new Promise<void>((resolve) => {
        resolve();
      });
    });
    return () => {
      closeSubscription.remove();
    };
  }, []);

  const onBackdropPress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const animationConfigs = useBottomSheetSpringConfigs({
    duration: 350,
    dampingRatio: 0.8,
    overshootClamping: true,
    stiffness: 250,
  });

  return (
    <View style={styles.bottomSheetContainer}>
      <Backdrop onPress={onBackdropPress} />
      <BottomSheet
        key={uuid}
        snapPoints={['70%']}
        index={0}
        ref={bottomSheetRef}
        handleComponent={null}
        animationConfigs={animationConfigs}
        backgroundStyle={styles.bottomSheetBackground}
        enablePanDownToClose
        onChange={onChange}>
        <DevMenuBottomSheetContext.Provider value={{ collapse: onCollapse, expand: onExpand }}>
          <BottomSheetScrollView style={styles.contentContainerStyle}>
            {children}
          </BottomSheetScrollView>
        </DevMenuBottomSheetContext.Provider>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  bottomSheetContainer: {
    flex: 1,
  },
  contentContainerStyle: {},
  bottomSheetBackground: {
    backgroundColor: '#f8f8fa',
  },
});

export default DevMenuBottomSheet;
