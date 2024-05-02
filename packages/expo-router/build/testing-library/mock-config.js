"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockContext = exports.getMockConfig = void 0;
const path_1 = __importDefault(require("path"));
const context_stubs_1 = require("./context-stubs");
const getLinkingConfig_1 = require("../getLinkingConfig");
const getRoutes_1 = require("../getRoutes");
function getMockConfig(context, metaOnly = true) {
    return (0, getLinkingConfig_1.getNavigationConfig)((0, getRoutes_1.getExactRoutes)(getMockContext(context)), metaOnly);
}
exports.getMockConfig = getMockConfig;
function getMockContext(context) {
    if (typeof context === 'string') {
        return (0, context_stubs_1.requireContext)(path_1.default.resolve(process.cwd(), context));
    }
    else if (Array.isArray(context)) {
        return (0, context_stubs_1.inMemoryContext)(Object.fromEntries(context.map((filename) => [filename, { default: () => null }])));
    }
    else if (!('appDir' in context)) {
        return (0, context_stubs_1.inMemoryContext)(context);
    }
    else if ('appDir' in context && typeof context.appDir === 'string') {
        return (0, context_stubs_1.requireContextWithOverrides)(context.appDir, context.overrides);
    }
    else {
        throw new Error('Invalid context');
    }
}
exports.getMockContext = getMockContext;
//# sourceMappingURL=mock-config.js.map