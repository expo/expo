"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerateDeclarations = exports.getWatchHandler = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const generate_1 = require("./generate");
const _ctx_1 = require("../../_ctx");
const matchers_1 = require("../matchers");
function getWatchHandler(outputDir) {
    const routeFiles = new Set(_ctx_1.ctx.keys().filter((key) => (0, matchers_1.isTypedRoutesFilename)(key)));
    return async function callback({ filePath, type }) {
        let shouldRegenerate = false;
        if (type === 'delete') {
            if (routeFiles.has(filePath)) {
                routeFiles.delete(filePath);
                shouldRegenerate = true;
            }
        }
        else if (type === 'add') {
            shouldRegenerate = (0, matchers_1.isTypedRoutesFilename)(filePath);
        }
        else {
            shouldRegenerate = routeFiles.has(filePath);
        }
        if (shouldRegenerate) {
            (0, exports.regenerateDeclarations)(outputDir);
        }
    };
}
exports.getWatchHandler = getWatchHandler;
exports.regenerateDeclarations = throttle((outputDir) => {
    const file = (0, generate_1.getTypedRoutesDeclarationFile)(_ctx_1.ctx);
    if (!file)
        return;
    node_fs_1.default.writeFileSync(node_path_1.default.resolve(outputDir, './router.d.ts'), file);
}, 100);
/**
 * Throttles a function to only run once every `internal` milliseconds.
 * If called while waiting, it will run again after the timer has elapsed.
 */
function throttle(fn, interval) {
    let timerId;
    let shouldRunAgain = false;
    return function run(...args) {
        if (timerId) {
            shouldRunAgain = true;
        }
        else {
            fn(...args);
            timerId = setTimeout(() => {
                timerId = null; // reset the timer so next call will be executed
                if (shouldRunAgain) {
                    run(...args); // call the function again
                }
            }, interval);
        }
    };
}
//# sourceMappingURL=index.js.map