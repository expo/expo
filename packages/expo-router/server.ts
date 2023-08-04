// These should be installed on the global by the server runtime to ensure faster bundling and smaller bundles.
export const ExpoRequest =
  global.ExpoResponse as import('@expo/server/build/environment').ExpoRequest;
export const ExpoResponse =
  global.ExpoResponse as import('@expo/server/build/environment').ExpoResponse;

export type RequestHandler = (
  request: typeof ExpoRequest
) => typeof ExpoResponse | Promise<typeof ExpoResponse>;
