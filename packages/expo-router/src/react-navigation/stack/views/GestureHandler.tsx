import * as React from 'react';
import { View } from 'react-native';
import type { PanGestureHandlerProperties } from 'react-native-gesture-handler';

const Dummy: any = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const PanGestureHandler =
  Dummy as React.ComponentType<PanGestureHandlerProperties>;

export const GestureHandlerRootView = View;

export const GestureState = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

export type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
