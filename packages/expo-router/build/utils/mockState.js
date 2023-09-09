import { getNavigationConfig } from '../getLinkingConfig';
import { getExactRoutes } from '../getRoutes';
export function createMockContextModule(map = {}) {
    const contextModule = jest.fn((key) => map[key]);
    Object.defineProperty(contextModule, 'keys', {
        value: () => Object.keys(map),
    });
    return contextModule;
}
export function configFromFs(map = []) {
    const ctx = map.reduce((acc, value) => {
        if (typeof value === 'string') {
            acc[value] = { default: () => { } };
            return acc;
        }
        acc[value[0]] = {
            default: () => { },
            ...value[1],
        };
        return acc;
    }, {});
    return getNavigationConfig(getExactRoutes(createMockContextModule(ctx)));
}
//# sourceMappingURL=mockState.js.map