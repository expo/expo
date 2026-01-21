export type { MiddlewareFunction } from 'expo-server';

export type RequestHandler = (
  request: Request,
  params: Record<string, string>
) => Response | Promise<Response>;
