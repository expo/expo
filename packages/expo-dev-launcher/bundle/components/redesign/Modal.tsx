import { Button } from 'expo-dev-client-components';
import * as React from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';

import { createAsyncStack, StackItem, useStackItems } from '../../functions/createAsyncStack';

export type ModalProps = {
  element: React.ReactElement<any>;
  modalProps?: {
    backgroundColor?: string;
  };
};

const ModalContext = React.createContext(createAsyncStack<ModalProps>());
export const useModalStack = () => React.useContext(ModalContext);

export function ModalProvider({ children }) {
  const modalStack = React.useRef(createAsyncStack<ModalProps>());

  return (
    <ModalContext.Provider value={modalStack.current}>
      {children}
      <ModalStackContainer />
    </ModalContext.Provider>
  );
}

function ModalStackContainer() {
  const modalStack = useModalStack();
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

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { backgroundColor }]}
      pointerEvents={hasModal ? 'auto' : 'none'}>
      {modals.map((item) => (
        <ModalScreen
          key={item.key}
          {...item}
          onClose={() => modalStack.pop()}
          onPopEnd={() => modalStack.onPopEnd(item.key)}
          onPushEnd={() => modalStack.onPushEnd(item.key)}
        />
      ))}
    </Animated.View>
  );
}

type ModalScreenProps = StackItem<ModalProps> & {
  onPushEnd: () => void;
  onPopEnd: () => void;
  onClose: () => void;
};

function ModalScreen({
  status,
  element,
  onPopEnd,
  onPushEnd,
  onClose,
  modalProps,
}: ModalScreenProps) {
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
      pointerEvents={status === 'popping' ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFillObject, { transform: [{ translateY }] }]}>
      <Button.Container style={StyleSheet.absoluteFill} onPress={() => onClose()}>
        {element}
      </Button.Container>
    </Animated.View>
  );
}
