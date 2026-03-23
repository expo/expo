import { getPathFromState, useStateForPath } from '@react-navigation/core';
import * as React from 'react';

import { LinkingContext } from './LinkingContext';

/**
 * Hook to get the path for the current route based on linking options.
 *
 * @returns Path for the current route.
 */
export function useRoutePath() {
  const { options } = React.useContext(LinkingContext);
  const state = useStateForPath();

  if (state === undefined) {
    throw new Error(
      "Couldn't find a state for the route object. Is your component inside a screen in a navigator?"
    );
  }

  const getPathFromStateHelper = options?.getPathFromState ?? getPathFromState;

  const path = React.useMemo(() => {
    if (options?.enabled === false) {
      return undefined;
    }

    const path = getPathFromStateHelper(state, options?.config);

    return path;
  }, [options?.enabled, options?.config, state, getPathFromStateHelper]);

  return path;
}
