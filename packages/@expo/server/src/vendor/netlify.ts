import { createRequestHandler as createExpoHandler } from './abstract';
import { createRequestScope } from '../runtime';
import { createNodeEnv } from './environment/node';
import { ScopeDefinition } from '../runtime/scope';

export { ExpoError } from './abstract';

const scopeSymbol = Symbol.for('expoServerScope');

interface NetlifyContext {
  deploy?: { context?: string | null };
  site?: { url?: string | null };
  waitUntil?: (promise: Promise<unknown>) => void;
  [scopeSymbol]?: unknown;
}

/** @see https://docs.netlify.com/build/functions/api/#netlify-specific-context-object */
function getContext(): NetlifyContext {
  const fromGlobal: typeof globalThis & {
    Netlify?: { context?: NetlifyContext };
  } = globalThis;
  if (!fromGlobal.Netlify) {
    throw new Error(
      '"globalThis.Netlify" is missing but expected.\n' +
        '- Are you using Netlify Server Functions 1.0 instead of 2.0?\n' +
        '- Make sure your Netlify function has a default export instead of exporting "handler".'
    );
  }
  return fromGlobal.Netlify?.context ?? {};
}

// Netlify already has an async-scoped context in NetlifyContext, so we can attach
// our scope context to this object
const STORE: ScopeDefinition = {
  getStore: () => getContext()[scopeSymbol],
  run(scope: any, runner: (...args: any[]) => any, ...args: any[]) {
    getContext()[scopeSymbol] = scope;
    return runner(...args);
  },
};

export function createRequestHandler(params: { build: string }) {
  const makeRequestAPISetup = (request: Request, context?: NetlifyContext) => ({
    origin: (context ?? getContext()).site?.url || request.headers.get('Origin') || 'null',
    environment: (context ?? getContext()).deploy?.context || null,
    waitUntil: (context ?? getContext()).waitUntil,
  });
  const run = createRequestScope(STORE, makeRequestAPISetup);
  const onRequest = createExpoHandler(createNodeEnv(params));
  return async (req: Request, ctx?: NetlifyContext) => {
    if ('multiValueHeaders' in req) {
      throw new Error(
        'Unexpected Request object. API was called by Netlify Server Functions 1.0\n' +
          '- Make sure your Netlify function has a default export instead of exporting "handler".'
      );
    }
    return await run(onRequest, req, ctx);
  };
}
