import { type ExpoRequest, type ExpoResponse } from '@expo/server';
export { type MiddlewareFunction } from '@expo/server';

export type RequestHandler = (
  request: Request,
  params: Record<string, string>
) => Response | Promise<Response>;

export { ExpoRequest, ExpoResponse };
