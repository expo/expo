"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiRoute = exports.getHtml = exports.getRoutesManifest = exports.handleRouteError = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const common_1 = require("./common");
Object.defineProperty(exports, "handleRouteError", { enumerable: true, get: function () { return common_1.handleRouteError; } });
const initManifestRegExp_1 = require("../utils/initManifestRegExp");
const debug = process.env.NODE_ENV === 'development'
    ? require('debug')('expo:server')
    : () => { };
const getRoutesManifest = (dist) => async () => {
    const raw = node_path_1.default.join(dist, '_expo/routes.json');
    // TODO: JSON Schema for validation
    const manifest = JSON.parse(node_fs_1.default.readFileSync(raw, 'utf-8'));
    return (0, initManifestRegExp_1.initManifestRegExp)(manifest);
};
exports.getRoutesManifest = getRoutesManifest;
const getHtml = (dist) => async (_request, route) => {
    // Serve a static file by exact route name
    const filePath = node_path_1.default.join(dist, route.page + '.html');
    if (node_fs_1.default.existsSync(filePath)) {
        return node_fs_1.default.readFileSync(filePath, 'utf-8');
    }
    // Serve a static file by route name with hoisted index
    // See: https://github.com/expo/expo/pull/27935
    const hoistedFilePath = route.page.match(/\/index$/)
        ? node_path_1.default.join(dist, route.page.replace(/\/index$/, '') + '.html')
        : null;
    if (hoistedFilePath && node_fs_1.default.existsSync(hoistedFilePath)) {
        return node_fs_1.default.readFileSync(hoistedFilePath, 'utf-8');
    }
    return null;
};
exports.getHtml = getHtml;
const getApiRoute = (dist) => 
// TODO: Can we type this more strict?
async (route) => {
    const filePath = node_path_1.default.join(dist, route.file);
    debug(`Handling API route: ${route.page}: ${filePath}`);
    // TODO: What's the standard behavior for malformed projects?
    if (!node_fs_1.default.existsSync(filePath)) {
        return null;
    }
    if (/\.c?js$/.test(filePath)) {
        return require(filePath);
    }
    return import(filePath);
};
exports.getApiRoute = getApiRoute;
//# sourceMappingURL=node.js.map