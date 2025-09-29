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
    });
}
export function createNodeRequestScope(scopeDefinition, params) {
    return createRequestScope(scopeDefinition, (request) => ({
        origin: request.headers.get('Origin') || 'null',
        environment: params.environment ?? process.env.NODE_ENV,
    }));
}
//# sourceMappingURL=node.js.map