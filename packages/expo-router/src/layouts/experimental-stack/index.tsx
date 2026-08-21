'use client';
import type { ComponentProps } from 'react';
import { Children, useMemo } from 'react';

import type { ParamListBase, StackNavigationState } from '../../react-navigation/native';
import { StackRouter } from '../../react-navigation/native';
import { unstable_integrateWithRouter } from '../../standard-navigation';
import { subscribePopToTopOnParentTabPress } from '../../standard-navigation/subscribePopToTopOnParentTabPress';
import { isChildOfType } from '../../utils/children';
import { Protected } from '../../views/Protected';
import { stackRouterOverride } from '../StackClient';
import { mapProtectedScreen, StackHeader, StackScreen } from '../stack-utils';
import {
  createStandardExperimentalStackNavigator,
  type ExperimentalStackNavigatorCreateProps,
  type StandardExperimentalStackNavigationEventMap,
} from './createExperimentalStackNavigator';
import type { ExperimentalStackNavigationOptions } from './types';

const RNExperimentalStack = unstable_integrateWithRouter<
  ExperimentalStackNavigationOptions,
  StackNavigationState<ParamListBase>,
  StandardExperimentalStackNavigationEventMap,
  object,
  object,
  ExperimentalStackNavigatorCreateProps
>(createStandardExperimentalStackNavigator, StackRouter, {
  createProps: ({ navigation, state }) => ({
    // The experimental stack receives the complete event-emitting navigation object at runtime.
    navigation: navigation as unknown as ExperimentalStackNavigatorCreateProps['navigation'],
    stackState: state,
    subscribePopToTopOnParentTabPress: () => subscribePopToTopOnParentTabPress(navigation, state),
  }),
});

/**
 * Renders the new `react-native-screens/experimental` native stack.
 *
 * Sibling to `Stack`. Native-only — on web it falls back to the standard `Stack`.
 * Opt-in per navigator: replace `<Stack />` with `<ExperimentalStack />` in the
 * specific layout you want to migrate.
 *
 * @experimental
 */
const ExperimentalStack = Object.assign(
  (props: ComponentProps<typeof RNExperimentalStack>) => {
    const rnChildren = useMemo(() => {
      const filtered = Children.toArray(props.children).filter(
        (child) => !isChildOfType(child, StackHeader)
      );
      return mapProtectedScreen({ guard: true, children: filtered }).children;
    }, [props.children]);

    return (
      <RNExperimentalStack {...props} children={rnChildren} UNSTABLE_router={stackRouterOverride} />
    );
  },
  {
    Screen: StackScreen,
    Protected,
  }
);

export { ExperimentalStack };

export default ExperimentalStack;

export type {
  ExperimentalStackNavigationOptions,
  ExperimentalStackNavigationEventMap,
  ExperimentalStackNavigationProp,
  ExperimentalStackScreenProps,
  ExperimentalStackNavigationHelpers,
} from './types';
