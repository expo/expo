import { createEnvironment } from './common';
import { createRequestScope } from '../../runtime';
const createCachedImport = () => {
    const importCache = new Map();
    return async function importCached(request) {
        let result = importCache.get(request);
        if (!result) {
            try {
                result = { type: 'success', value: await import(request) };
            }
            catch (error) {
                result = { type: 'error', value: error };
            }
            importCache.set(request, result);
        }
        if (result.type === 'success') {
            return result.value;
        }
        else {
            throw result.value;
        }
    };
};
export function createWorkerdEnv(params) {
    const build = params.build || '.';
    const importCached = createCachedImport();
    async function readText(request) {
        try {
            const mod = await importCached(`${build}/${request}`);
            return mod.default;
        }
        catch {
            return null;
        }
    }
    async function readJson(request) {
        try {
            const mod = await importCached(`${build}/${request}`);
            if (typeof mod.default === 'string' && mod.default[0] === '{') {
                return JSON.parse(mod.default);
            }
            else {
                return mod.default;
            }
        }
        catch {
            return null;
        }
    }
    async function loadModule(request) {
        const target = `${build}/${request}`;
        return (await import(target)).default;
    }
    return createEnvironment({
        readText,
        readJson,
        loadModule,
    });
}
export function createWorkerdRequestScope(scopeDefinition, params) {
    const makeRequestAPISetup = (request, _env, ctx) => ({
        origin: request.headers.get('Origin') || 'null',
        environment: params.environment ?? null,
        waitUntil: ctx.waitUntil?.bind(ctx),
    });
    return createRequestScope(scopeDefinition, makeRequestAPISetup);
}
//# sourceMappingURL=workerd.js.map