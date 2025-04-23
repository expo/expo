import { Button } from 'expo-dev-client-components';
import * as React from 'react';
import { Animated, StyleSheet, Pressable } from 'react-native';

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
      Animated.timing(animatedValue.current, {
        toValue: 1,
        useNativeDriver: true,
        duration: 200,
      }).start();
    } else {
      Animated.timing(animatedValue.current, {
        toValue: 0,
        useNativeDriver: true,
        duration: 200,
      }).start();
    }
  }, [hasModal]);

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
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(0,0,0,0.75)', opacity: animatedValue.current },
        ]}
        pointerEvents={hasModal ? 'box-none' : 'none'}>
        <Pressable
          onPress={() => {
            modalStack.pop();
          }}
          style={[StyleSheet.absoluteFillObject]}>
          {modals.map((item) => (
            <ModalScreen
              {...item}
              key={item.key}
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
  onClose: () => void;
};

function ModalScreen({ status, data, onPushEnd, onPopEnd }: ModalScreenProps) {
  const { element } = data;

  React.useEffect(() => {
    if (status === 'pushing') {
      onPushEnd();
    } else if (status === 'popping') {
      onPopEnd();
    }
  }, [status]);

  return (
    <Animated.View
      pointerEvents={status === 'popping' ? 'none' : 'box-none'}
      style={[
        StyleSheet.absoluteFillObject,
        {
          justifyContent: 'center',
        },
      ]}>
      <Button.Container>{element}</Button.Container>
    </Animated.View>
  );
}
