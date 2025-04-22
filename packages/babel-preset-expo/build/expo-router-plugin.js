"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoRouterBabelPlugin = expoRouterBabelPlugin;
/**
 * Copyright © 2024 650 Industries.
 */
const core_1 = require("@babel/core");
const node_path_1 = __importDefault(require("node:path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const common_1 = require("./common");
const debug = require('debug')('expo:babel:router');
function getExpoRouterAppRoot(projectRoot, appFolder) {
    // TODO: We should have cache invalidation if the expo-router/entry file location changes.
    const routerEntry = (0, resolve_from_1.default)(projectRoot, 'expo-router/entry');
    const appRoot = node_path_1.default.relative(node_path_1.default.dirname(routerEntry), appFolder);
    debug('routerEntry', routerEntry, appFolder, appRoot);
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
    function isFirstInAssign(path) {
        return core_1.types.isAssignmentExpression(path.parent) && path.parent.left === path.node;
    }
    return {
        name: 'expo-router',
        visitor: {
            MemberExpression(path, state) {
                const projectRoot = possibleProjectRoot || state.file.opts.root || '';
                if (path.get('object').matchesPattern('process.env')) {
                    const key = path.toComputedKey();
                    if (t.isStringLiteral(key) && !isFirstInAssign(path)) {
                        // Used for log box on web.
                        if (key.value.startsWith('EXPO_PROJECT_ROOT')) {
                            path.replaceWith(t.stringLiteral(projectRoot));
                        }
                        else if (key.value.startsWith('EXPO_ROUTER_IMPORT_MODE')) {
                            path.replaceWith(t.stringLiteral(asyncRoutes ? 'lazy' : 'sync'));
                        }
                        if (
                        // Skip loading the app root in tests.
                        // This is handled by the testing-library utils
                        process.env.NODE_ENV !== 'test') {
                            if (key.value.startsWith('EXPO_ROUTER_ABS_APP_ROOT')) {
                                path.replaceWith(t.stringLiteral(routerAbsoluteRoot));
                            }
                            else if (key.value.startsWith('EXPO_ROUTER_APP_ROOT')) {
                                path.replaceWith(t.stringLiteral(getExpoRouterAppRoot(projectRoot, routerAbsoluteRoot)));
                            }
                        }
                    }
                }
            },
        },
    };
}
