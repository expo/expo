"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoRouterBabelPlugin = expoRouterBabelPlugin;
const node_path_1 = __importDefault(require("node:path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const common_1 = require("./common");
const debug = require('debug')('expo:babel:router');
// Cache for getExpoRouterAppRoot results (projectRoot -> appRoot)
const appRootCache = new Map();
function getExpoRouterAppRoot(projectRoot, appFolder) {
    const cacheKey = `${projectRoot}:${appFolder}`;
    const cached = appRootCache.get(cacheKey);
    if (cached !== undefined) {
        return cached;
    }
    // TODO: We should have cache invalidation if the expo-router/entry file location changes.
    const routerEntry = (0, resolve_from_1.default)(projectRoot, 'expo-router/entry');
    const appRoot = node_path_1.default.relative(node_path_1.default.dirname(routerEntry), appFolder);
    debug('routerEntry', routerEntry, appFolder, appRoot);
    appRootCache.set(cacheKey, appRoot);
    return appRoot;
}
/**
 * Inlines environment variables to configure the process:
 *
 * EXPO_PROJECT_ROOT
 * EXPO_ROUTER_ABS_APP_ROOT
 * EXPO_ROUTER_APP_ROOT
 * EXPO_ROUTER_IMPORT_MODE
 */
function expoRouterBabelPlugin(api) {
    const { types: t } = api;
    const possibleProjectRoot = api.caller(common_1.getPossibleProjectRoot);
    const asyncRoutes = api.caller(common_1.getAsyncRoutes);
    const routerAbsoluteRoot = api.caller(common_1.getExpoRouterAbsoluteAppRoot);
    const importMode = asyncRoutes ? 'lazy' : 'sync';
    return {
        name: 'expo-router',
        pre() {
            const state = this;
            state.projectRoot = possibleProjectRoot || this.file.opts.root || '';
            // Check test env at transform time, not module load time
            state.isTestEnv = process.env.NODE_ENV === 'test';
        },
        visitor: {
            MemberExpression(path, state) {
                // Quick check: skip if not accessing something on an object named 'process'
                const object = path.node.object;
                if (!t.isMemberExpression(object))
                    return;
                const objectOfObject = object.object;
                if (!t.isIdentifier(objectOfObject) || objectOfObject.name !== 'process')
                    return;
                // Now check if it's process.env
                if (!t.isIdentifier(object.property) || object.property.name !== 'env')
                    return;
                // Skip if this is an assignment target
                if (t.isAssignmentExpression(path.parent) && path.parent.left === path.node)
                    return;
                // Get the property key
                const key = path.toComputedKey();
                if (!t.isStringLiteral(key))
                    return;
                const keyValue = key.value;
                // Check each possible env var
                if (keyValue.startsWith('EXPO_PROJECT_ROOT')) {
                    path.replaceWith(t.stringLiteral(state.projectRoot));
                    return;
                }
                if (keyValue.startsWith('EXPO_ROUTER_IMPORT_MODE')) {
                    path.replaceWith(t.stringLiteral(importMode));
                    return;
                }
                // Skip app root transforms in tests (handled by testing-library utils)
                if (state.isTestEnv)
                    return;
                if (keyValue.startsWith('EXPO_ROUTER_ABS_APP_ROOT')) {
                    path.replaceWith(t.stringLiteral(routerAbsoluteRoot));
                    return;
                }
                if (keyValue.startsWith('EXPO_ROUTER_APP_ROOT')) {
                    path.replaceWith(t.stringLiteral(getExpoRouterAppRoot(state.projectRoot, routerAbsoluteRoot)));
                }
            },
        },
    };
}
