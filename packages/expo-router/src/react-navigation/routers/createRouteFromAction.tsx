import { createParamsFromAction } from './createParamsFromAction';
import { getNextRouteKeyFromState } from './getRouteKey';
import type { ParamListBase } from './types';

type Options = {
  action: {
    payload: {
      name: string;
      params?: object;
    };
  };
  routeParamList: ParamListBase;
};

/**
 * Build a route for a create action, with a deterministic key (see `getRouteKey`) derived from the
 * navigator `pathname`, the route name, and the next index free in `state` so it never collides
 * with a live route.
 */
export function createRouteFromAction(
  { action, routeParamList }: Options,
  pathname: string | undefined,
  state: { routes: readonly { key: string; name: string }[] }
) {
  const { name } = action.payload;

  return {
    key: getNextRouteKeyFromState(pathname, name, state),
    name,
    params: createParamsFromAction({ action, routeParamList }),
  };
}
