import path from 'path';
import { inMemoryContext, requireContext, requireContextWithOverrides, } from './context-stubs';
import { getNavigationConfig } from '../getLinkingConfig';
import { getExactRoutes } from '../getRoutes.mjs';
export function getMockConfig(context, metaOnly = true) {
    return getNavigationConfig(getExactRoutes(getMockContext(context)), metaOnly);
}
export function getMockContext(context) {
    if (typeof context === 'string') {
        return requireContext(path.resolve(process.cwd(), context));
    }
    else if (Array.isArray(context)) {
        return inMemoryContext(Object.fromEntries(context.map((filename) => [filename, { default: () => null }])));
    }
    else if (!('appDir' in context)) {
        return inMemoryContext(context);
    }
    else if ('appDir' in context && typeof context.appDir === 'string') {
        return requireContextWithOverrides(context.appDir, context.overrides);
    }
    else {
        throw new Error('Invalid context');
    }
}
//# sourceMappingURL=mock-config.js.map