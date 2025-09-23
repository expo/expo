import { createEnvironment } from './common';
import { createRequestScope } from '../../runtime';

const createCachedImport = () => {
  const importCache = new Map<string, { type: 'error' | 'success'; value: unknown }>();
  return async function importCached<T = any>(request: string): Promise<T> {
    let result = importCache.get(request);
    if (!result) {
      try {
        result = { type: 'success', value: await import(request) };
      } catch (error) {
        result = { type: 'error', value: error };
      }
      importCache.set(request, result);
    }
    if (result.type === 'success') {
      return result.value as T;
    } else {
      throw result.value;
    }
  };
};

interface WorkerdEnvParams {
  build?: string;
  environment?: string | null;
}

export function createWorkerdEnv(params: WorkerdEnvParams) {
  const build = params.build || '.';
  const importCached = createCachedImport();

  async function readText(request: string) {
    try {
      const mod = await importCached<{ default: string }>(`${build}/${request}`);
      return mod.default;
    } catch {
      return null;
    }
  }

  async function readJson(request: string) {
    try {
      const mod = await importCached(`${build}/${request}`);
      if (typeof mod.default === 'string' && mod.default[0] === '{') {
        return JSON.parse(mod.default);
      } else {
        return mod.default;
      }
    } catch {
      return null;
    }
  }

  async function loadModule(request: string) {
    const target = `${build}/${request}`;
    return (await import(target)).default;
  }

  return createEnvironment({
    readText,
    readJson,
    loadModule,
  });
}

export interface ExecutionContext {
  waitUntil?(promise: Promise<any>): void;
  props?: any;
}

export function createWorkerdRequestScope<Env = unknown>(params: WorkerdEnvParams) {
  const makeRequestAPISetup = (request: Request, _env: Env, ctx: ExecutionContext) => ({
    origin: request.headers.get('Origin') || 'null',
    environment: params.environment ?? null,
    waitUntil: ctx.waitUntil?.bind(ctx),
  });
  return createRequestScope(makeRequestAPISetup);
}
