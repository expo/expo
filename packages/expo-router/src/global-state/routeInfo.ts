import * as queryString from 'query-string';

import { State } from '../fork/getPathFromState';
import { getStateFromPath } from '../fork/getStateFromPath';

type Options = Parameters<typeof getStateFromPath>[1];

export function reconstructState(
  state: State | undefined,
  getState: typeof getStateFromPath,
  options: Options
) {
  const segments: string[] = [];

  const allParams = {};

  while (state?.routes?.length) {
    const route = state.routes[state.routes.length - 1];
    segments.push(...route.name.split('/'));

    state = route.state;

    if (route.params) {
      const { screen, params, ...other } = route.params as Record<string, any>;
      Object.assign(allParams, other);

      if (screen) {
        state = {
          routeNames: [screen],
          routes: [{ name: screen, params }],
        };
      }
    }
  }

  if (segments.length && segments[segments.length - 1] === 'index') {
    segments.pop();
  }

  let path = `/${segments.filter(Boolean).join('/')}`;
  const query = queryString.stringify(allParams, { sort: false });

  if (query) {
    path += `?${query}`;
  }

  return getState(path, options);
}
