import type { NavigationState, ParamListBase } from '@react-navigation/routers';
import * as React from 'react';

import { CurrentRenderContext } from './CurrentRenderContext';
import type {
  Descriptor,
  NavigationHelpers,
  NavigationProp,
  RouteProp,
} from './types';

type Options = {
  state: NavigationState;
  navigation: NavigationHelpers<ParamListBase>;
  descriptors: Record<
    string,
    Descriptor<object, NavigationProp<ParamListBase>, RouteProp<ParamListBase>>
  >;
};

/**
 * Write the current options, so that server renderer can get current values
 * Mutating values like this is not safe in async mode, but it doesn't apply to SSR
 */
export function useCurrentRender({ state, navigation, descriptors }: Options) {
  const current = React.useContext(CurrentRenderContext);

  if (current && navigation.isFocused()) {
    current.options = descriptors[state.routes[state.index].key].options;
  }
}
