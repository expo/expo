import { ExpoRequest, ExpoResponse } from '@expo/server/build/environment';

export type RequestHandler = (
  request: Request,
  params: Record<string, string>
) => Response | Promise<Response>;

export { ExpoRequest, ExpoResponse };
