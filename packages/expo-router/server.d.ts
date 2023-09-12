// These should be installed on the global by the server runtime to ensure faster bundling and smaller bundles.

import { ExpoRequest, ExpoResponse } from '@expo/server/build/environment';

export type RequestHandler = (
  request: ExpoRequest,
  params: Record<string, string>
) => ExpoResponse | Promise<ExpoResponse>;

export { ExpoRequest, ExpoResponse };
