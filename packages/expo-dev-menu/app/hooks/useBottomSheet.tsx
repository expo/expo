import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';

import { BottomSheet } from '../components/BottomSheet';
import { hideMenu, subscribeToCloseEvents, subscribeToOpenEvents } from '../native-modules/DevMenu';

const { onChange, cond, eq, call, Value } = Animated;

const BottomSheetContext = React.createContext<{ collapse: () => void }>(null);

type BottomSheetProviderProps = {
  children: React.ReactNode;
};

export function BottomSheetProvider({ children }: BottomSheetProviderProps) {
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

  const collapse = () => {
    bottomSheetRef.current?.snapTo(0);
  };

  const callbackNode = React.useRef(new Value(0));

  function hideApp() {
    hideMenu();
  }

  const trackCallbackNode = React.useRef(
    onChange(callbackNode.current, cond(eq(callbackNode.current, 0), call([], hideApp)))
  );

  const backgroundOpacity = callbackNode.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const { height: screenHeight } = useWindowDimensions();

  return (
    <BottomSheetContext.Provider value={{ collapse }}>
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
          screenHeight={screenHeight}
          ref={bottomSheetRef}
          callbackNode={callbackNode.current}
          snapPoints={snapPoints}>
          {children}
          <Animated.Code exec={trackCallbackNode.current} />
        </BottomSheet>
      </View>
    </BottomSheetContext.Provider>
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

export const useBottomSheet = () => React.useContext(BottomSheetContext);
