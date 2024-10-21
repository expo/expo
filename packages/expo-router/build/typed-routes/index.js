"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerateDeclarations = exports.getWatchHandler = exports.version = void 0;
const _ctx_shared_1 = require("expo-router/_ctx-shared");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const generate_1 = require("./generate");
const matchers_1 = require("../matchers");
const require_context_ponyfill_1 = __importDefault(require("../testing-library/require-context-ponyfill"));
const defaultCtx = (0, require_context_ponyfill_1.default)(process.env.EXPO_ROUTER_APP_ROOT, true, _ctx_shared_1.EXPO_ROUTER_CTX_IGNORE);
/**
 * This file is imported via `@expo/cli`. While users should be using the same SDK version of `expo-router` as `@expo/cli`,
 * this export allows us to ensure that the version of the `expo-router` package is compatible with the version of `@expo/cli`.
 */
exports.version = 52;
/**
 * Generate a Metro watch handler that regenerates the typed routes declaration file
 */
function getWatchHandler(outputDir, { ctx = defaultCtx, regenerateFn = exports.regenerateDeclarations } = {} // Exposed for testing
) {
    const routeFiles = new Set(ctx.keys().filter((key) => (0, matchers_1.isTypedRoute)(key)));
    return async function callback({ filePath, type }) {
        // Sanity check that we are in an Expo Router project
        if (!process.env.EXPO_ROUTER_APP_ROOT)
            return;
        let shouldRegenerate = false;
        let relativePath = node_path_1.default.relative(process.env.EXPO_ROUTER_APP_ROOT, filePath);
        const isInsideAppRoot = !relativePath.startsWith('../');
        const basename = node_path_1.default.basename(relativePath);
        if (!isInsideAppRoot)
            return;
        // require.context paths always start with './' when relative to the root
        relativePath = `./${relativePath}`;
        if (type === 'delete') {
            ctx.__delete(relativePath);
            if (routeFiles.has(relativePath)) {
                routeFiles.delete(relativePath);
                shouldRegenerate = true;
            }
        }
        else if (type === 'add') {
            ctx.__add(relativePath);
            if ((0, matchers_1.isTypedRoute)(basename)) {
                routeFiles.add(relativePath);
                shouldRegenerate = true;
            }
        }
        else {
            shouldRegenerate = routeFiles.has(relativePath);
        }
        if (shouldRegenerate) {
            regenerateFn(outputDir, ctx);
        }
    };
}
exports.getWatchHandler = getWatchHandler;
/**
 * Regenerate the declaration file.
 *
 * This function needs to be debounced due to Metro's handling of renaming folders.
 * For example, if you have the file /(tabs)/route.tsx and you rename the folder to /(tabs,test)/route.tsx
 *
 * Metro will fire 2 filesystem events:
 *  - ADD /(tabs,test)/router.tsx
 *  - DELETE /(tabs)/router.tsx
 *
 * If you process the types after the ADD, then they will crash as you will have conflicting routes
 */
exports.regenerateDeclarations = debounce((outputDir, options = {}, ctx = defaultCtx) => {
    // Don't crash the process, just log the error. The user will most likely fix it and continue
    try {
        const file = (0, generate_1.getTypedRoutesDeclarationFile)(ctx, options);
        if (!file)
            return;
        node_fs_1.default.writeFileSync(node_path_1.default.resolve(outputDir, './router.d.ts'), file);
    }
    catch (error) {
        console.error(error);
    }
});
/**
 * Debounce a function to only run once after a period of inactivity
 * If called while waiting, it will reset the timer
 */
function debounce(fn, timeout = 1000) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
        }, timeout);
    };
}
//# sourceMappingURL=index.js.map