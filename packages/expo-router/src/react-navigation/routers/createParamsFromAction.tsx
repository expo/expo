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

export function createParamsFromAction({ action, routeParamList }: Options) {
  const { name, params } = action.payload;

  return routeParamList[name] !== undefined
    ? {
        ...routeParamList[name],
        ...params,
      }
    : params;
}
