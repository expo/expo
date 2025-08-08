import { ExpoRequest, ExpoResponse } from '@expo/server/build/environment';
export { MiddlewareFunction } from '@expo/server/build/types';

export type RequestHandler = (
  request: Request,
  params: Record<string, string>
) => Response | Promise<Response>;

export { ExpoRequest, ExpoResponse };
