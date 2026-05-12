'use client';
import type { ComponentProps } from 'react';
import { Children, useMemo } from 'react';

import { createExperimentalStackNavigator } from './createExperimentalStackNavigator';
import { stackRouterOverride } from '../StackClient';
import { mapProtectedScreen, StackHeader, StackScreen } from '../stack-utils';
import { withLayoutContext } from '../withLayoutContext';
import type {
  ExperimentalStackNavigationEventMap,
  ExperimentalStackNavigationOptions,
} from './types';
import type { ParamListBase, StackNavigationState } from '../../react-navigation/native';
import { isChildOfType } from '../../utils/children';
import { Protected } from '../../views/Protected';

const ExperimentalStackNavigator = createExperimentalStackNavigator().Navigator;

const RNExperimentalStack = withLayoutContext<
  ExperimentalStackNavigationOptions,
  typeof ExperimentalStackNavigator,
  StackNavigationState<ParamListBase>,
  ExperimentalStackNavigationEventMap
>(ExperimentalStackNavigator);

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
