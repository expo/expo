'use client';
import React, { use } from 'react';

import type { NavigationState, ParamListBase } from '../routers';

type Selector<ParamList extends ParamListBase, T> = (state: NavigationState<ParamList>) => T;

/**
 * Hook to get a value from the current navigation state using a selector.
 *
 * @param selector Selector function to get a value from the state.
 */
export function useNavigationState<ParamList extends ParamListBase, T>(
  selector: Selector<ParamList, T>
): T {
  const state = use(NavigatorStateContext);

  if (state == null) {
    throw new Error("Couldn't get the navigation state. Is your component inside a navigator?");
  }

  // @ts-expect-error: this is unsafe, but needed to make the generic work
  return selector(state);
}

export const NavigatorStateContext = React.createContext<
  NavigationState<ParamListBase> | undefined
>(undefined);
