import { Button } from 'expo-dev-client-components';
import * as React from 'react';
import { Animated, StyleSheet, useWindowDimensions, Pressable } from 'react-native';

import {
  createAsyncStack,
  StackItem,
  StackItemComponent,
  useStackItems,
} from '../functions/createAsyncStack';

type ModalStackContextProps = {
  push: (element: StackItemComponent) => StackItem;
  pop: (amount?: number) => StackItem[];
};

const ModalStackContext = React.createContext<ModalStackContextProps | null>(null);
export const useModalStack = () => React.useContext(ModalStackContext);
const defaultModalStack = createAsyncStack();

export function ModalStackProvider({ children, modalStack = defaultModalStack }) {
  const modals = useStackItems(modalStack);

  const animatedValue = React.useRef(new Animated.Value(0));

  const hasModal = modals.some((m) => m.status === 'settled' || m.status === 'pushing');

  React.useEffect(() => {
    if (hasModal) {
      Animated.spring(animatedValue.current, {
        toValue: 1,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.spring(animatedValue.current, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  }, [hasModal]);

  const backgroundColor = animatedValue.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)'],
  });

  function push(element: StackItemComponent) {
    return modalStack.push({ element });
  }

  function pop(amount: number = 1) {
    return modalStack.pop(amount);
  }

  return (
    <ModalStackContext.Provider value={{ push, pop }}>
      {children}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor }]}
        pointerEvents={hasModal ? 'box-none' : 'none'}>
        <Pressable
          onPress={() => {
            modalStack.pop();
          }}
          style={[StyleSheet.absoluteFillObject]}>
          {modals.map((item) => (
            <ModalScreen
              key={item.key}
              {...item}
              onClose={item.pop}
              onPopEnd={item.onPopEnd}
              onPushEnd={item.onPushEnd}
            />
          ))}
        </Pressable>
      </Animated.View>
    </ModalStackContext.Provider>
  );
}

type ModalScreenProps = StackItem & {
  onPushEnd: () => void;
  onPopEnd: () => void;
  onClose: () => void;
};

function ModalScreen({ status, data, onPopEnd, onPushEnd }: ModalScreenProps) {
  const { element } = data;
  const { height } = useWindowDimensions();

  const animatedValue = React.useRef(new Animated.Value(status === 'settled' ? 1 : 0));

  React.useEffect(() => {
    if (status === 'pushing') {
      Animated.spring(animatedValue.current, {
        toValue: 1,
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        useNativeDriver: true,
      }).start(() => onPushEnd());
    }

    if (status === 'popping') {
      Animated.spring(animatedValue.current, {
        toValue: 0,
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        useNativeDriver: true,
      }).start(() => onPopEnd());
    }
  }, [status]);

  const translateY = animatedValue.current.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  return (
    <Animated.View
      pointerEvents={status === 'popping' ? 'none' : 'box-none'}
      style={[
        StyleSheet.absoluteFillObject,
        { justifyContent: 'center', transform: [{ translateY }] },
      ]}>
      <Button.Container>{element}</Button.Container>
    </Animated.View>
  );
}
