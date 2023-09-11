import {
  InitialState,
  NavigationState,
  ParamListBase,
  PartialState,
  getActionFromState,
} from '@react-navigation/native';

import { ResultState } from '../fork/getStateFromPath';

export type NavigateAction = Extract<
  ReturnType<typeof getActionFromState>,
  { type: 'NAVIGATE' }
> & {
  payload: NavigateActionParams;
};

export type NavigateActionParams = {
  params?: NavigateActionParams;
  path: string;
  initial: boolean;
  screen: string;
  name?: string;
};

// Get the last state for a given target state (generated from a path).
function findTopStateForTarget(state: ResultState) {
  let current: Partial<InitialState> | undefined = state;
  let previous: Partial<InitialState> | undefined = state;

  while (current?.routes?.[current?.routes?.length - 1].state != null) {
    previous = current;
    current = current?.routes[current?.routes.length - 1].state;
  }

  // If the last route in the target state is an index route, return the previous state (parent).
  // NOTE: This may need to be updated to support initial route name being a non-standard value.
  if (previous && current?.routes?.[current.routes.length - 1]!.name === 'index') {
    return previous;
  }

  return current;
}
