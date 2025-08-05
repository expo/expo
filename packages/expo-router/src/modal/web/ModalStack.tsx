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
import React, { useCallback } from 'react';

import { ModalStackRouteDrawer } from './ModalStackRouteDrawer';
import { TransparentModalStackRouteDrawer } from './TransparentModalStackRouteDrawer';
import { ModalStackNavigatorProps, ModalStackViewProps } from './types';
import {
  convertStackStateToNonModalState,
  findLastNonModalIndex,
  isTransparentModalPresentation,
} from './utils';
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

  const dismiss = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const overlayRoutes = React.useMemo(() => {
    if (!isWeb) return [];
    const idx = findLastNonModalIndex(state, descriptors);
    return state.routes.slice(idx + 1);
  }, [isWeb, state, descriptors]);

  return (
    <div style={{ flex: 1, display: 'flex' }}>
      <NativeStackView
        state={newStackState}
        navigation={navigation}
        descriptors={descriptors}
        describe={describe}
      />
      {isWeb &&
        overlayRoutes.map((route) => {
          const isTransparentModal = isTransparentModalPresentation(descriptors[route.key].options);

          const ModalComponent = isTransparentModal
            ? TransparentModalStackRouteDrawer
            : ModalStackRouteDrawer;

          return (
            <ModalComponent
              key={route.key}
              routeKey={route.key}
              options={descriptors[route.key].options as ExtendedStackNavigationOptions}
              renderScreen={descriptors[route.key].render}
              onDismiss={dismiss}
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
