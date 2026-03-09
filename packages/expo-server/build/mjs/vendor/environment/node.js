import fs from 'node:fs';
import path from 'node:path';
import { createEnvironment } from './common';
import { assertRuntimeFetchAPISupport } from '../../ImmutableRequest';
import { createRequestScope } from '../../runtime';
export function createNodeEnv(params) {
    assertRuntimeFetchAPISupport();
    async function readText(request) {
        const filePath = path.join(params.build, request);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        try {
            return await fs.promises.readFile(filePath, 'utf-8');
        }
        catch {
            return null;
        }
    }
    async function readJson(request) {
        const json = await readText(request);
        return json != null ? JSON.parse(json) : null;
    }
    async function loadModule(request) {
        const filePath = path.join(params.build, request);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        else if (/\.c?js$/.test(filePath)) {
            return require(filePath);
        }
        else {
            return await import(filePath);
        }
    }
    return createEnvironment({
        readText,
        readJson,
        loadModule,
        isDevelopment: params.isDevelopment ?? false,
    });
}
const getRequestURLOrigin = (request) => {
    try {
        // NOTE: We don't trust any headers on incoming requests in "raw" environments
        return new URL(request.url).origin || null;
    }
    catch {
        return null;
    }
};
export function createNodeRequestScope(scopeDefinition, params) {
    return createRequestScope(scopeDefinition, (request) => ({
        requestHeaders: request.headers,
        origin: getRequestURLOrigin(request),
        environment: params.environment ?? process.env.NODE_ENV,
    }));
}
//# sourceMappingURL=node.js.map