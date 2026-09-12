type Options = {
  key: string;
  action: {
    payload: {
      name: string;
      params?: object;
    };
  };
};

export function createRouteFromAction({ action, key }: Options) {
  const { name, params } = action.payload;

  return {
    key,
    name,
    params,
  };
}
