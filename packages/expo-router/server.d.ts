import '@expo/server/build/environment';

export type RequestHandler = (
  request: Request,
  params: Record<string, string>
) => Response | Promise<Response>;
