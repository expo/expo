'use client';

import { createNavigatorFactory, useNavigationBuilder } from '@react-navigation/native';

import {
  NativeStackRouter,
  type NativeStackRouterOptions,
  type NativeStackState,
} from './NativeStackRouter';
import { NativeStackView } from './NativeStackView';
import type { NativeStackNavigationEventMap, NativeStackOptions, NativeStackProps } from './types';
import { withLayoutContext } from '../layouts/withLayoutContext';

export function NativeStackNavigator({
  children,
  screenListeners,
  screenOptions,
}: NativeStackProps) {
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    NativeStackState,
    NativeStackRouterOptions,
    Record<string, (...args: unknown[]) => void>,
    NativeStackOptions,
    NativeStackNavigationEventMap
  >(NativeStackRouter, {
    children,
    screenListeners,
    screenOptions,
  });

  return (
    <NavigationContent>
      <NativeStackView state={state} navigation={navigation} descriptors={descriptors} />
    </NavigationContent>
  );
}

const createNativeStackNavigatorFactory = createNavigatorFactory(NativeStackNavigator);

export const NativeStackWithContext = withLayoutContext<
  NativeStackOptions,
  typeof NativeStackNavigator,
  NativeStackState,
  NativeStackNavigationEventMap
>(createNativeStackNavigatorFactory().Navigator);
