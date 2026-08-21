import { nanoid } from 'nanoid/non-secure';

type Options = {
  action: {
    payload: {
      name: string;
      params?: object;
    };
  };
};

export function createRouteFromAction({ action }: Options) {
  const { name, params } = action.payload;

  return {
    key: `${name}-${nanoid()}`,
    name,
    params,
  };
}
