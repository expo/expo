"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeEnv = createNodeEnv;
exports.createNodeRequestScope = createNodeRequestScope;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const common_1 = require("./common");
const ImmutableRequest_1 = require("../../ImmutableRequest");
const runtime_1 = require("../../runtime");
function createNodeEnv(params) {
    (0, ImmutableRequest_1.assertRuntimeFetchAPISupport)();
    async function readText(request) {
        const filePath = node_path_1.default.join(params.build, request);
        if (!node_fs_1.default.existsSync(filePath)) {
            return null;
        }
        try {
            return await node_fs_1.default.promises.readFile(filePath, 'utf-8');
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
        const filePath = node_path_1.default.join(params.build, request);
        if (!node_fs_1.default.existsSync(filePath)) {
            return null;
        }
        else if (/\.c?js$/.test(filePath)) {
            return require(filePath);
        }
        else {
            return await import(filePath);
        }
    }
    return (0, common_1.createEnvironment)({
        readText,
        readJson,
        loadModule,
    });
}
function createNodeRequestScope(scopeDefinition, params) {
    return (0, runtime_1.createRequestScope)(scopeDefinition, (request) => ({
        origin: request.headers.get('Origin') || 'null',
        environment: params.environment ?? process.env.NODE_ENV,
    }));
}
//# sourceMappingURL=node.js.map