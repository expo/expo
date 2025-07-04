'use client';
import {
  createNavigatorFactory,
  ParamListBase,
  StackActionHelpers,
  StackNavigationState,
  StackRouter,
  StackRouterOptions,
  useNavigationBuilder,
  useTheme,
} from '@react-navigation/native';
import {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
  NativeStackView,
} from '@react-navigation/native-stack';
import React from 'react';

import { ModalStackRouteDrawer } from './ModalStackRouteDrawer.web';
import { ModalStackNavigatorProps, ModalStackViewProps } from './types';
import { isModalPresentation } from './utils';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';
import { withLayoutContext } from '../../layouts/withLayoutContext';

function ModalStackNavigator({
  initialRouteName,
  children,
  screenOptions,
}: ModalStackNavigatorProps) {
  const { state, navigation, descriptors, NavigationContent, describe } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    NativeStackNavigationOptions,
    NativeStackNavigationEventMap
  >(StackRouter, {
    children,
    screenOptions,
    initialRouteName,
  });

  return (
    <NavigationContent>
      <ModalStackView
        state={state}
        navigation={navigation}
        descriptors={descriptors}
        describe={describe}
      />
    </NavigationContent>
  );
}

const ModalStackView = ({ state, navigation, descriptors, describe }: ModalStackViewProps) => {
  const isWeb = process.env.EXPO_OS === 'web';
  const { colors } = useTheme();

  const { routes: filteredRoutes, index: nonModalIndex } = convertStackStateToNonModalState(
    state,
    descriptors,
    isWeb
  );

  const newStackState = { ...state, routes: filteredRoutes, index: nonModalIndex };

  return (
    <div style={{ flex: 1, display: 'flex' }}>
      <NativeStackView
        state={newStackState}
        navigation={navigation}
        descriptors={descriptors}
        describe={describe}
      />
      {isWeb &&
        state.routes.map((route, i) => {
          const isModalType = isModalPresentation(descriptors[route.key].options);
          const isActive = i === state.index && isModalType;
          if (!isActive) return null;

          return (
            <ModalStackRouteDrawer
              key={route.key}
              routeKey={route.key}
              options={descriptors[route.key].options as ExtendedStackNavigationOptions}
              renderScreen={descriptors[route.key].render}
              onDismiss={() => navigation.goBack()}
              themeColors={colors}
            />
          );
        })}
    </div>
  );
};

const createModalStack = createNavigatorFactory(ModalStackNavigator);
const RouterModal = withLayoutContext(createModalStack().Navigator);
const RouterModalScreen = RouterModal.Screen;

export { RouterModal, RouterModalScreen };

/**
 * Returns a copy of the given Stack navigation state with any modal-type routes removed
 * (only when running on the web) and a recalculated `index` that still points at the
 * currently active non-modal route. If the active route *is* a modal that gets
 * filtered out, we fall back to the last remaining route – this matches the logic
 * used inside `ModalStackView` so that the underlying `NativeStackView` never tries
 * to render a modal screen that is simultaneously being shown in the overlay.
 *
 * This helper is exported primarily for unit-testing; it should be considered
 * internal to `ModalStack.web` and not a public API.
 *
 * @internal
 */
export function convertStackStateToNonModalState(
  state: StackNavigationState<ParamListBase>,
  descriptors: Record<string, { options: ExtendedStackNavigationOptions }>,
  isWeb: boolean
) {
  const routes = state.routes.filter((route) => {
    const isModalType = isModalPresentation(descriptors[route.key].options);
    return !(isWeb && isModalType);
  });

  let index = routes.findIndex((r) => r.key === state.routes[state.index]?.key);
  if (index < 0) index = routes.length - 1;

  return { routes, index };
}
