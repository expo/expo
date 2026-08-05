import { nanoid } from 'nanoid/non-secure';

import { createParamsFromAction } from './createParamsFromAction';
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

export function createRouteFromAction({ action, routeParamList }: Options) {
  const { name } = action.payload;

  return {
    key: `${name}-${nanoid()}`,
    name,
    params: createParamsFromAction({ action, routeParamList }),
  };
}
