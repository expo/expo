import { ExpoRequest, ExpoResponse } from '@expo/server/build/environment';

export type RequestHandler = (request: ExpoRequest) => ExpoResponse | Promise<ExpoResponse>;

export { ExpoRequest, ExpoResponse };
