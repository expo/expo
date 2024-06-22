import { Button } from 'expo-dev-client-components';
import * as React from 'react';
import { Animated, LayoutRectangle, useWindowDimensions, StyleSheet } from 'react-native';

import {
  createAsyncStack,
  StackItem,
  Status,
  StackItemComponent,
  useStackItems,
} from '../functions/createAsyncStack';

export type ToastOptions = {
  durationMs?: number;
};

export type ToastStackItem = {
  element: StackItemComponent;
  toastProps?: ToastOptions;
};

export type ToastProps = {
  animatedValue: Animated.Value;
  pop: () => void;
  status: Status;
};

const defaultDistanceFromBottom = 100;

type ToastStackContextProps = {
  push: (element: StackItemComponent, options?: ToastOptions) => StackItem<ToastStackItem>;
  pop: (amount?: number) => StackItem<ToastStackItem>[];
  getItems: () => StackItem<ToastStackItem>[];
};

const ToastStackContext = React.createContext<ToastStackContextProps | null>(null);
export const useToastStack = () => {
  const context = React.useContext(ToastStackContext);

  if (!context) {
    throw new Error(`useToastStack() was called outside of a <ToastStackContext /> provider`);
  }

  return context;
};

export function ToastStackProvider({ children }) {
  const toastStack = React.useRef(createAsyncStack<ToastStackItem>()).current;
  const toasts = useStackItems(toastStack);

  function push(element: StackItemComponent, options?: ToastOptions): StackItem<ToastStackItem> {
    return toastStack.push({ element, toastProps: options });
  }

  function pop(amount: number = 1) {
    return toastStack.pop(amount);
  }

  function getItems() {
    return toastStack.getState().items;
  }

  return (
    <ToastStackContext.Provider value={{ push, pop, getItems }}>
      {children}
      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill]}>
        {toasts.map((toast) => (
          <ToastItem {...toast} />
        ))}
      </Animated.View>
    </ToastStackContext.Provider>
  );
}

function ToastItem(props: StackItem<ToastStackItem>) {
  const { status, data, onPopEnd, onPushEnd, pop, animatedValue } = props;
  const { toastProps, element: Element } = data;

  const { height } = useWindowDimensions();

  const [layout, setLayout] = React.useState<LayoutRectangle | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (status === 'pushing') {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start(onPushEnd);
    }

    if (status === 'popping') {
      Animated.spring(animatedValue, {
        toValue: 2,
        useNativeDriver: true,
      }).start(() => {
        onPopEnd();

        if (timerRef.current != null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      });
    }

    if (status === 'settled') {
      timerRef.current = setTimeout(() => {
        pop();
        timerRef.current = null;
      }, toastProps?.durationMs || 2000);
    }

    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [status, pop, toastProps?.durationMs]);

  let distanceFromBottom = defaultDistanceFromBottom;

  if (layout != null) {
    distanceFromBottom = distanceFromBottom + layout.height;
  }

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [height, height - distanceFromBottom, height - distanceFromBottom],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 1, 0],
  });

  const isPopping = status === 'popping' || status === 'popped';

  return (
    <Animated.View
      onLayout={({ nativeEvent: { layout } }) => setLayout(layout)}
      pointerEvents={isPopping ? 'none' : 'box-none'}
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      <Button.FadeOnPressContainer onPress={pop}>
        <Element {...props} />
      </Button.FadeOnPressContainer>
    </Animated.View>
  );
}
