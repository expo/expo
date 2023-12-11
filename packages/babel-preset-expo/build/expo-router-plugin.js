"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoRouterBabelPlugin = void 0;
const core_1 = require("@babel/core");
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const common_1 = require("./common");
const debug = require('debug')('expo:babel:router');
function getExpoRouterAppRoot(projectRoot, appFolder) {
    // TODO: We should have cache invalidation if the expo-router/entry file location changes.
    const routerEntry = (0, resolve_from_1.default)(projectRoot, 'expo-router/entry');
    const appRoot = path_1.default.relative(path_1.default.dirname(routerEntry), appFolder);
    debug('routerEntry', routerEntry, appFolder, appRoot);
    return appRoot;
}
/**
 * Inlines environment variables to configure the process:
 *
 * EXPO_PROJECT_ROOT
 * EXPO_PUBLIC_USE_STATIC
 * EXPO_ROUTER_ABS_APP_ROOT
 * EXPO_ROUTER_APP_ROOT
 * EXPO_ROUTER_IMPORT_MODE
 */
function expoRouterBabelPlugin(api) {
    const { types: t } = api;
    const platform = api.caller(common_1.getPlatform);
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
                        else if (
                        // TODO: Add cache invalidation.
                        key.value.startsWith('EXPO_PUBLIC_USE_STATIC')) {
                            if (platform === 'web') {
                                const isStatic = process.env.EXPO_PUBLIC_USE_STATIC === 'true' ||
                                    process.env.EXPO_PUBLIC_USE_STATIC === '1';
                                path.replaceWith(t.booleanLiteral(isStatic));
                            }
                            else {
                                path.replaceWith(t.booleanLiteral(false));
                            }
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
                                path.replaceWith(t.stringLiteral(getExpoRouterAppRoot(possibleProjectRoot, routerAbsoluteRoot)));
                            }
                        }
                    }
                }
            },
        },
    };
}
exports.expoRouterBabelPlugin = expoRouterBabelPlugin;
