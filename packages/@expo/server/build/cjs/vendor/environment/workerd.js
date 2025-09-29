"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkerdEnv = createWorkerdEnv;
const common_1 = require("./common");
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
function createWorkerdEnv(params) {
    const importCached = createCachedImport();
    async function readText(request) {
        try {
            const mod = await importCached(`${params.build}/${request}`);
            return mod.default;
        }
        catch {
            return null;
        }
    }
    async function readJson(request) {
        try {
            const mod = await importCached(`${params.build}/${request}`);
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
        const target = `${params.build}/${request}`;
        return (await import(target)).default;
    }
    return (0, common_1.createEnvironment)({
        readText,
        readJson,
        loadModule,
    });
}
//# sourceMappingURL=workerd.js.map