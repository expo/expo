"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configFromFs = exports.createMockContextModule = void 0;
const getLinkingConfig_1 = require("../getLinkingConfig");
const getRoutes_1 = require("../getRoutes");
function createMockContextModule(map = {}) {
    const contextModule = jest.fn((key) => map[key]);
    Object.defineProperty(contextModule, 'keys', {
        value: () => Object.keys(map),
    });
    return contextModule;
}
exports.createMockContextModule = createMockContextModule;
function configFromFs(map = []) {
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
    return (0, getLinkingConfig_1.getNavigationConfig)((0, getRoutes_1.getExactRoutes)(createMockContextModule(ctx)));
}
exports.configFromFs = configFromFs;
//# sourceMappingURL=mockState.js.map