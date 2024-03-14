import path from 'path';
import { inMemoryContext, requireContext, requireContextWithOverrides, } from './context-stubs';
import { getNavigationConfig } from '../getLinkingConfig';
import { getExactRoutes } from '../getRoutes';
function isOverrideContext(context) {
    return Boolean(typeof context === 'object' && 'appDir' in context);
}
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
    else if (isOverrideContext(context)) {
        return requireContextWithOverrides(context.appDir, context.overrides);
    }
    else {
        return inMemoryContext(context);
    }
}
//# sourceMappingURL=mock-config.js.map