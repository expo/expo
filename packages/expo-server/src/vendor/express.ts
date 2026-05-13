import type * as express from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

import {
  createRequestHandler as createExpoHandler,
  type RequestHandlerInput as ExpoRequestHandlerInput,
  type RequestHandlerParams as ExpoRequestHandlerParams,
} from './abstract';
import { createNodeEnv, createNodeRequestScope } from './environment/node';
import { respond, convertRequest } from './http';

export { ExpoError } from './abstract';

export type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => Promise<void>;

const STORE = new AsyncLocalStorage();

export interface RequestHandlerParams
  extends ExpoRequestHandlerParams,
    Partial<ExpoRequestHandlerInput> {
  handleRouteError?(error: Error): Promise<Response>;
}

/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler(
  params: { build: string; environment?: string | null },
  setup?: RequestHandlerParams
): RequestHandler {
  const run = createNodeRequestScope(STORE, params);
  const onRequest = createExpoHandler({
    ...createNodeEnv(params),
    ...setup,
  });

  async function requestHandler(request: Request): Promise<Response> {
    try {
      return await run(onRequest, request);
    } catch (error) {
      const handleRouteError = setup?.handleRouteError;
      if (handleRouteError && error != null && typeof error === 'object') {
        try {
          return await handleRouteError(error as Error);
        } catch {
          // Rethrow original error below
        }
      }
      throw error;
    }
  }

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req?.url || !req.method) {
      return next();
    }
    try {
      const request = convertRequest(req, res);
      const response = await requestHandler(request);
      await respond(res, response);
    } catch (error: unknown) {
      // Express doesn't support async functions, so we have to pass along the
      // error manually using next().
      next(error);
    }
  };
}

export { convertRequest, respond } from './http';
